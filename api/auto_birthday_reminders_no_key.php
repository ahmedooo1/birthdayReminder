<?php
// Endpoint pour les rappels automatiques d'anniversaire - VERSION SANS CLÉ API (TEMPORAIRE)
require_once 'config.php';
require_once 'utils.php';

// Headers pour JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Pour les tests - RETIREZ CETTE SECTION EN PRODUCTION
if ($_SERVER['HTTP_HOST'] === 'localhost' || strpos($_SERVER['HTTP_HOST'], '.aa-world.store') !== false) {
    // OK pour les domaines autorisés
} else {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé']);
    exit;
}

try {
    $startTime = microtime(true);
    
    // 1. Récupérer tous les anniversaires
    $stmt = $pdo->query("SELECT id, name, date, group_id FROM birthdays");
    $birthdays = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $processedBirthdays = [];
    $totalEmailsSent = 0;
    
    foreach ($birthdays as $birthday) {
        $birthdayName = $birthday['name'];
        $birthdayDate = $birthday['date'];
        $groupId = $birthday['group_id'];
        
        $daysUntil = daysUntilNextBirthday($birthdayDate);
        $emailsSentForThisBirthday = 0;
        
        // Récupérer les membres du groupe
        $stmt = $pdo->prepare("
            SELECT u.email, u.username, u.email_notifications, u.notification_days
            FROM users u
            JOIN group_members gm ON u.id = gm.user_id
            WHERE gm.group_id = ? AND u.email_notifications = 1
        ");
        $stmt->execute([$groupId]);
        $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($members as $member) {
            if (empty($member['email'])) continue;
            
            $userPrefDays = (int)$member['notification_days'];
            $shouldSendEmail = false;
            $emailSubject = '';
            $emailMessage = '';
            
            if ($daysUntil == 0) {
                // Anniversaire aujourd'hui
                $shouldSendEmail = true;
                $emailSubject = "🎉 Joyeux Anniversaire " . $birthdayName . " !";
                $emailMessage = "
                <html>
                <body style='font-family: Arial, sans-serif;'>
                    <h2 style='color: #4361ee;'>🎉 Joyeux Anniversaire !</h2>
                    <p>Bonjour " . $member['username'] . ",</p>
                    <p>C'est l'anniversaire de <strong>" . $birthdayName . "</strong> aujourd'hui !</p>
                    <p>N'oubliez pas de lui souhaiter ! 🎂</p>
                    <br>
                    <p>Cordialement,<br>Votre Application de Rappel d'Anniversaires</p>
                </body>
                </html>";
            } elseif ($daysUntil > 0 && $daysUntil == $userPrefDays) {
                // Rappel basé sur la préférence
                $shouldSendEmail = true;
                $plural = ($daysUntil > 1) ? 's' : '';
                $emailSubject = "⏰ Rappel : Anniversaire de " . $birthdayName . " dans " . $daysUntil . " jour" . $plural;
                $emailMessage = "
                <html>
                <body style='font-family: Arial, sans-serif;'>
                    <h2 style='color: #4361ee;'>⏰ Rappel d'Anniversaire</h2>
                    <p>Bonjour " . $member['username'] . ",</p>
                    <p>L'anniversaire de <strong>" . $birthdayName . "</strong> est dans <strong>" . $daysUntil . " jour" . $plural . "</strong> !</p>
                    <p>Préparez-vous à célébrer ! 🎉</p>
                    <br>
                    <p>Cordialement,<br>Votre Application de Rappel d'Anniversaires</p>
                </body>
                </html>";
            }
            
            if ($shouldSendEmail) {
                if (sendEmail($member['email'], $emailSubject, $emailMessage)) {
                    $emailsSentForThisBirthday++;
                    $totalEmailsSent++;
                }
            }
        }
        
        $processedBirthdays[] = [
            'name' => $birthdayName,
            'date' => $birthdayDate,
            'days_until' => $daysUntil,
            'emails_sent' => $emailsSentForThisBirthday
        ];
    }
    
    $endTime = microtime(true);
    $executionTime = round($endTime - $startTime, 2);
    
    echo json_encode([
        'status' => 'completed',
        'timestamp' => date('Y-m-d H:i:s'),
        'birthdays_processed' => $processedBirthdays,
        'total_emails_sent' => $totalEmailsSent,
        'execution_time' => $executionTime . ' secondes'
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur lors de l\'exécution',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
