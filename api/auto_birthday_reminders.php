<?php
/**
 * Endpoint API pour déclencher automatiquement les rappels d'anniversaire
 * URL: /api/auto_birthday_reminders.php
 * 
 * Ce script peut être appelé :
 * 1. Via un service CRON externe (cron-job.org, etc.)
 * 2. Via un webhook automatique
 * 3. Via un appel CURL programmé
 */

require_once 'config.php';
require_once 'utils.php';

// Sécurisation avec une clé API
$apiKey = env('BIRTHDAY_REMINDER_API_KEY', 'your-secret-key-here');
$providedKey = $_GET['api_key'] ?? $_POST['api_key'] ?? '';

if ($providedKey !== $apiKey) {
    http_response_code(401);
    echo json_encode(['error' => 'Clé API invalide']);
    exit;
}

// Headers pour les logs
header('Content-Type: application/json');

$startTime = time();
$results = [];

try {
    $results['status'] = 'started';
    $results['timestamp'] = date('Y-m-d H:i:s');
    
    // 1. Récupérer tous les anniversaires actifs
    $stmtBirthdays = $pdo->query("SELECT id, name, date, group_id FROM birthdays");
    $birthdays = $stmtBirthdays->fetchAll(PDO::FETCH_ASSOC);

    if (empty($birthdays)) {
        $results['message'] = 'Aucun anniversaire trouvé';
        $results['emails_sent'] = 0;
        echo json_encode($results);
        exit;
    }

    $emailsSentCount = 0;
    $results['birthdays_processed'] = [];

    foreach ($birthdays as $birthday) {
        $birthdayName = $birthday['name'];
        $birthdayDate = $birthday['date'];
        $groupId = $birthday['group_id'];

        $daysUntil = daysUntilNextBirthday($birthdayDate);
        
        // Skip birthdays with invalid dates
        if ($daysUntil === -1) {
            continue;
        }
        
        $nextBirthdayDateFormatted = formatDate(getNextBirthdayDate($birthdayDate), 'd/m/Y');
        
        $birthdayResult = [
            'name' => $birthdayName,
            'date' => $birthdayDate,
            'days_until' => $daysUntil,
            'emails_sent' => 0
        ];

        // 2. Récupérer les membres du groupe associé à l'anniversaire
        $stmtGroupMembers = $pdo->prepare("
            SELECT u.id, u.email, u.username, u.first_name, u.last_name, u.email_notifications, u.notification_days
            FROM users u
            JOIN group_members gm ON u.id = gm.user_id
            WHERE gm.group_id = ?
        ");
        $stmtGroupMembers->execute([$groupId]);
        $groupMembers = $stmtGroupMembers->fetchAll(PDO::FETCH_ASSOC);

        if (empty($groupMembers)) {
            $birthdayResult['message'] = 'Aucun membre dans le groupe';
            $results['birthdays_processed'][] = $birthdayResult;
            continue;
        }

        foreach ($groupMembers as $member) {
            if (empty($member['email']) || !$member['email_notifications']) {
                continue;
            }

            $userPrefDays = (int)$member['notification_days'];

            $shouldSendEmail = false;
            $emailSubject = '';
            $emailMessageBody = '';

            // Construire le nom utilisateur
            $firstName = trim($member['first_name'] ?? '');
            $lastName = trim($member['last_name'] ?? '');
            $userName = trim($firstName . ' ' . $lastName);
            
            if (empty($userName)) {
                $userName = $member['username'] ?? 'Utilisateur';
            }

            if ($daysUntil == 0) { // Anniversaire aujourd'hui
                $shouldSendEmail = true;
                $emailSubject = "🎉 Joyeux Anniversaire " . $birthdayName . " !";
                $emailMessageBody = '
                <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <h2 style="color: #4361ee; margin-bottom: 20px;">🎉 Joyeux Anniversaire !</h2>
                        <p>Bonjour ' . htmlspecialchars($userName) . ',</p>
                        <p>C\'est l\'anniversaire de <strong>' . htmlspecialchars($birthdayName) . '</strong> aujourd\'hui (' . $nextBirthdayDateFormatted . ') !</p>
                        <p>N\'oubliez pas de lui souhaiter un joyeux anniversaire ! 🎂</p>
                        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e9ecef;">
                        <p style="font-size: 12px; color: #6c757d;">
                            Birthday Reminder - Système de rappels d\'anniversaires<br>
                            Cet email a été envoyé automatiquement.
                        </p>
                    </div>
                </body>
                </html>';
            } elseif ($daysUntil > 0 && $daysUntil == $userPrefDays) { // Rappel
                $shouldSendEmail = true;
                $plural = ($daysUntil > 1) ? 's' : '';
                $emailSubject = "📅 Rappel : Anniversaire de " . $birthdayName . " dans " . $daysUntil . " jour" . $plural;
                $emailMessageBody = '
                <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <h2 style="color: #4361ee; margin-bottom: 20px;">📅 Rappel d\'anniversaire</h2>
                        <p>Bonjour ' . htmlspecialchars($userName) . ',</p>
                        <p>Ceci est un rappel que l\'anniversaire de <strong>' . htmlspecialchars($birthdayName) . '</strong> est dans <strong>' . $daysUntil . ' jour' . $plural . '</strong> (le ' . $nextBirthdayDateFormatted . ').</p>
                        <p>Préparez-vous à célébrer ! 🎈</p>
                        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e9ecef;">
                        <p style="font-size: 12px; color: #6c757d;">
                            Birthday Reminder - Système de rappels d\'anniversaires<br>
                            Cet email a été envoyé automatiquement.
                        </p>
                    </div>
                </body>
                </html>';
            }

            if ($shouldSendEmail && claimReminder($pdo, 'email', $member['email'], $birthday['id'])) {
                if (sendEmail($member['email'], $emailSubject, $emailMessageBody)) {
                    $emailsSentCount++;
                    $birthdayResult['emails_sent']++;
                } else {
                    releaseReminder($pdo, 'email', $member['email'], $birthday['id']);
                }
            }
        }

        $results['birthdays_processed'][] = $birthdayResult;
    }

    $results['status'] = 'completed';
    $results['total_emails_sent'] = $emailsSentCount;
    $results['execution_time'] = time() - $startTime . ' secondes';

} catch (PDOException $e) {
    $results['status'] = 'error';
    $results['error'] = 'Erreur de base de données : ' . $e->getMessage();
    error_log("Erreur PDO dans auto_birthday_reminders.php: " . $e->getMessage());
} catch (Exception $e) {
    $results['status'] = 'error';
    $results['error'] = 'Erreur générale : ' . $e->getMessage();
    error_log("Erreur générale dans auto_birthday_reminders.php: " . $e->getMessage());
}

echo json_encode($results, JSON_PRETTY_PRINT);
?>
