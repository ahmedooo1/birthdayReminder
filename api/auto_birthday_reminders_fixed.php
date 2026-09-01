<?php
// Endpoint pour les rappels automatiques d'anniversaire
require_once 'config.php';
require_once 'utils.php';

// Headers pour JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// SOLUTION TEMPORAIRE : Désactiver la vérification de clé API
$debug_mode = false; // CHANGEZ CECI À false EN PRODUCTION

if (!$debug_mode) {
    // Vérification de la clé API (normalement activée)
    $expectedApiKey = env('BIRTHDAY_REMINDER_API_KEY', 'bd_12345_auto_reminder_secret_key_change_this');
    $providedApiKey = $_GET['api_key'] ?? $_POST['api_key'] ?? '';
    
    if ($providedApiKey !== $expectedApiKey) {
        http_response_code(401);
        echo json_encode(['error' => 'Clé API invalide']);
        exit;
    }
}

// Vérification du domaine pour sécurité minimale
if ($_SERVER['HTTP_HOST'] !== 'localhost' && 
    strpos($_SERVER['HTTP_HOST'], '.aaweb.fr') === false && 
    strpos($_SERVER['HTTP_HOST'], 'rappelanniv.aaweb.fr') === false) {
    http_response_code(403);
    echo json_encode(['error' => 'Accès refusé depuis ce domaine']);
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
        $stmt2 = $pdo->prepare("
            SELECT u.email, u.username, u.email_notifications, u.notification_days, u.first_name, u.last_name
            FROM users u
            JOIN group_members gm ON u.id = gm.user_id
            WHERE gm.group_id = ? AND u.email_notifications = 1
        ");
        $stmt2->execute([$groupId]);
        $members = $stmt2->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($members as $member) {
            if (empty($member['email'])) continue;
            
            $userPrefDays = (int)$member['notification_days'];
            $shouldSendEmail = false;
            $emailSubject = '';
            $emailMessage = '';
            
            // Construire le nom de l'utilisateur
            $firstName = trim($member['first_name'] ?? '');
            $lastName = trim($member['last_name'] ?? '');
            $userName = trim($firstName . ' ' . $lastName);
            
            if (empty($userName)) {
                $userName = $member['username'] ?? 'Utilisateur';
            }
            
            if ($daysUntil == 0) {
                // Anniversaire aujourd'hui
                $shouldSendEmail = true;
                $emailSubject = "🎉 Joyeux Anniversaire " . $birthdayName . " !";
                $emailMessage = "
                <html>
                <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px;'>
                        <h2 style='color: #4361ee; margin-bottom: 20px;'>🎉 Joyeux Anniversaire !</h2>
                        <p>Bonjour " . htmlspecialchars($userName) . ",</p>
                        <p>C'est l'anniversaire de <strong>" . htmlspecialchars($birthdayName) . "</strong> aujourd'hui !</p>
                        <p>N'oubliez pas de lui souhaiter ! 🎂</p>
                        <hr style='margin: 20px 0; border: none; border-top: 1px solid #e9ecef;'>
                        <p style='font-size: 12px; color: #6c757d;'>
                            Birthday Reminder - Système de gestion d'anniversaires<br>
                            Cet email a été envoyé automatiquement.
                        </p>
                    </div>
                </body>
                </html>";
            } elseif ($daysUntil > 0 && $daysUntil == $userPrefDays) {
                // Rappel basé sur la préférence
                $shouldSendEmail = true;
                $plural = ($daysUntil > 1) ? 's' : '';
                $emailSubject = "⏰ Rappel : Anniversaire de " . $birthdayName . " dans " . $daysUntil . " jour" . $plural;
                $emailMessage = "
                <html>
                <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px;'>
                        <h2 style='color: #4361ee; margin-bottom: 20px;'>⏰ Rappel d'Anniversaire</h2>
                        <p>Bonjour " . htmlspecialchars($userName) . ",</p>
                        <p>L'anniversaire de <strong>" . htmlspecialchars($birthdayName) . "</strong> est dans <strong>" . $daysUntil . " jour" . $plural . "</strong> !</p>
                        <p>Préparez-vous à célébrer ! 🎉</p>
                        <hr style='margin: 20px 0; border: none; border-top: 1px solid #e9ecef;'>
                        <p style='font-size: 12px; color: #6c757d;'>
                            Birthday Reminder - Système de gestion d'anniversaires<br>
                            Cet email a été envoyé automatiquement.
                        </p>
                    </div>
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
        'execution_time' => $executionTime . ' secondes',
        'debug_mode' => $debug_mode,
        'domain' => $_SERVER['HTTP_HOST'] ?? 'unknown'
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erreur lors de l\'exécution',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s'),
        'line' => $e->getLine(),
        'file' => basename($e->getFile())
    ]);
}
?>
