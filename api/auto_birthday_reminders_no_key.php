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
if ($_SERVER['HTTP_HOST'] === 'localhost' || strpos($_SERVER['HTTP_HOST'], '.aaweb.fr') !== false) {
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
    $totalSmsSent = 0;
    
    foreach ($birthdays as $birthday) {
        $birthdayName = $birthday['name'];
        $birthdayDate = $birthday['date'];
        $groupId = $birthday['group_id'];
        
        $daysUntil = daysUntilNextBirthday($birthdayDate);
        $emailsSentForThisBirthday = 0;
        
        // Récupérer les membres du groupe
        $stmt = $pdo->prepare("
            SELECT u.email, u.username, u.email_notifications, u.notification_days, 
                   u.phone_number, u.sms_notifications,
                   u.telegram_bot_token, u.telegram_chat_id, u.telegram_notifications
            FROM users u
            JOIN group_members gm ON u.id = gm.user_id
            WHERE gm.group_id = ?
        ");
        $stmt->execute([$groupId]);
        $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
    foreach ($members as $member) {
            $userPrefDays = (int)$member['notification_days'];
            $shouldSendEmail = false;
            $shouldSendSms = false;
            $shouldSendTelegram = false;
            $emailSubject = '';
            $emailMessage = '';
            $smsMessage = '';
            $telegramMessage = '';
            
            if ($daysUntil == 0) {
                // Anniversaire aujourd'hui
                $shouldSendEmail = true;
                $shouldSendSms = true;
                $shouldSendTelegram = true;
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
                $smsMessage = "Rappel: C'est l'anniversaire de {$birthdayName} aujourd'hui 🎉";
                $telegramMessage = "🎉 <b>Joyeux Anniversaire !</b> 🎉\nC'est l'anniversaire de <b>{$birthdayName}</b> aujourd'hui ! N'oubliez pas de lui souhaiter ! 🎂";
            } elseif ($daysUntil > 0 && $daysUntil == $userPrefDays) {
                // Rappel basé sur la préférence
                $shouldSendEmail = true;
                $shouldSendSms = true;
                $shouldSendTelegram = true;
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
                $smsMessage = "Rappel: Anniversaire de {$birthdayName} dans {$daysUntil} jour{$plural}.";
                $telegramMessage = "⏰ <b>Rappel d'Anniversaire</b> ⏰\nL'anniversaire de <b>{$birthdayName}</b> est dans <b>{$daysUntil} jour{$plural}</b> !";
            }
            
            if ($shouldSendEmail && !empty($member['email']) && (int)$member['email_notifications'] === 1) {
                if (sendEmail($member['email'], $emailSubject, $emailMessage)) {
                    $emailsSentForThisBirthday++;
                    $totalEmailsSent++;
                }
            }

            // Envoi Telegram
            if ($shouldSendTelegram && (int)($member['telegram_notifications'] ?? 0) === 1) {
                // Prefer global bot token if configured, else fallback to per-user token (legacy)
                $globalBotToken = env('TELEGRAM_BOT_TOKEN', '');
                $tokenToUse = !empty($globalBotToken) ? $globalBotToken : ($member['telegram_bot_token'] ?? '');
                if (!empty($tokenToUse) && !empty($member['telegram_chat_id'])) {
                    sendTelegramMessage($tokenToUse, $member['telegram_chat_id'], $telegramMessage);
                }
            }

            // Temporairement désactivé
            // if ($shouldSendSms && !empty($member['phone_number']) && (int)($member['sms_notifications'] ?? 0) === 1) {
            //     if (sendSms($member['phone_number'], $smsMessage)) {
            //         $totalSmsSent++;
            //     }
            // }
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
    'total_sms_sent' => $totalSmsSent,
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
