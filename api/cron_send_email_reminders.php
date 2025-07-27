<?php
require_once 'config.php';
require_once 'utils.php'; // Contient sendEmail, daysUntilNextBirthday, getNextBirthdayDate

// Optionnel: Augmenter le temps d'exécution pour les scripts longs
set_time_limit(300); // 5 minutes

echo "Démarrage du script de rappel d'anniversaire par e-mail...\n";

try {
    // 1. Récupérer tous les anniversaires actifs
    $stmtBirthdays = $pdo->query("SELECT id, name, date, group_id FROM birthdays");
    $birthdays = $stmtBirthdays->fetchAll(PDO::FETCH_ASSOC);

    if (empty($birthdays)) {
        echo "Aucun anniversaire trouvé.\n";
        exit;
    }

    $emailsSentCount = 0;    foreach ($birthdays as $birthday) {
        $birthdayName = $birthday['name'];
        $birthdayDate = $birthday['date'];
        $groupId = $birthday['group_id'];

        $daysUntil = daysUntilNextBirthday($birthdayDate);
        $nextBirthdayDateFormatted = formatDate(getNextBirthdayDate($birthdayDate), 'd/m/Y');
        
        echo "Traitement de l'anniversaire: $birthdayName (Date: $birthdayDate, Jours restants: $daysUntil)\n";

        // 2. Récupérer les membres du groupe associé à l'anniversaire
        $stmtGroupMembers = $pdo->prepare("
            SELECT u.id, u.email, u.username, u.email_notifications, u.notification_days
            FROM users u
            JOIN group_members gm ON u.id = gm.user_id
            WHERE gm.group_id = ?
        ");        $stmtGroupMembers->execute([$groupId]);
        $groupMembers = $stmtGroupMembers->fetchAll(PDO::FETCH_ASSOC);

        echo "Groupe ID: $groupId - Nombre de membres: " . count($groupMembers) . "\n";
        
        if (empty($groupMembers)) {
            echo "Aucun membre dans le groupe $groupId pour l'anniversaire de $birthdayName. Skip.\n";
            continue; // Passer à l'anniversaire suivant si le groupe n'a pas de membres
        }

        foreach ($groupMembers as $member) {
            if (empty($member['email'])) {
                echo "L'utilisateur " . $member['username'] . " (ID: " . $member['id'] . ") n'a pas d'adresse e-mail configurée. Skip.\n";
                continue;
            }

            if (!$member['email_notifications']) {
                // echo "L'utilisateur " . $member['username'] . " a désactivé les notifications par e-mail. Skip.\n";
                continue;
            }            $userPrefDays = (int)$member['notification_days']; // Nombre de jours avant l'anniversaire pour notifier

            echo "Utilisateur: " . $member['username'] . " - Notifications: " . ($member['email_notifications'] ? 'ON' : 'OFF') . " - Jours d'avance: $userPrefDays - Jours restants: $daysUntil\n";

            $shouldSendEmail = false;
            $emailSubject = '';
            $emailMessageBody = '';

            if ($daysUntil == 0) { // Anniversaire aujourd'hui
                $shouldSendEmail = true;
                $emailSubject = "Joyeux Anniversaire " . $birthdayName . " !";
                $emailMessageBody = "Bonjour " . $member['username'] . ",<br><br>" .
                                    "C'est l'anniversaire de <strong>" . $birthdayName . "</strong> aujourd'hui (" . $nextBirthdayDateFormatted . ") !<br><br>" .
                                    "N'oubliez pas de lui souhaiter !<br><br>" .
                                    "Cordialement,<br>RappelAnniv";
            } elseif ($daysUntil > 0 && $daysUntil == $userPrefDays) { // Rappel basé sur la préférence utilisateur
                $shouldSendEmail = true;
                $plural = ($daysUntil > 1) ? 's' : '';
                $emailSubject = "Rappel : Anniversaire de " . $birthdayName . " dans " . $daysUntil . " jour" . $plural;
                $emailMessageBody = "Bonjour " . $member['username'] . ",<br><br>" .
                                    "Ceci est un rappel que l'anniversaire de <strong>" . $birthdayName . "</strong> est dans <strong>" . $daysUntil . " jour" . $plural . "</strong> (le " . $nextBirthdayDateFormatted . ").<br><br>" .
                                    "Préparez-vous à célébrer !<br><br>" .
                                    "Cordialement,<br>RappelAnniv";
            }

            if ($shouldSendEmail) {
                echo "Préparation de l'envoi d'un e-mail à " . $member['email'] . " pour l'anniversaire de " . $birthdayName . "...\n";
                if (sendEmail($member['email'], $emailSubject, $emailMessageBody)) {
                    echo "E-mail envoyé avec succès à " . $member['email'] . "\n";
                    $emailsSentCount++;
                } else {
                    echo "Échec de l'envoi de l'e-mail à " . $member['email'] . ". Vérifiez la configuration du serveur mail et les logs.\n";
                }
            }
        }
    }

    echo "Script terminé. " . $emailsSentCount . " e-mail(s) de rappel envoyé(s).\n";

} catch (PDOException $e) {
    echo "Erreur de base de données : " . $e->getMessage() . "\n";
    error_log("Erreur PDO dans cron_send_email_reminders.php: " . $e->getMessage());
} catch (Exception $e) {
    echo "Erreur générale : " . $e->getMessage() . "\n";
    error_log("Erreur générale dans cron_send_email_reminders.php: " . $e->getMessage());
}

?>
