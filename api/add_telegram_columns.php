<?php
require_once 'config.php';

try {
    // Vérifier si la colonne telegram_bot_token existe
    $checkTokenColumn = $pdo->query("SHOW COLUMNS FROM `users` LIKE 'telegram_bot_token'");
    if ($checkTokenColumn->rowCount() == 0) {
        $pdo->exec("ALTER TABLE `users` ADD `telegram_bot_token` VARCHAR(255) NULL DEFAULT NULL;");
        echo "Colonne 'telegram_bot_token' ajoutée.<br>";
    } else {
        echo "Colonne 'telegram_bot_token' existe déjà.<br>";
    }

    // Vérifier si la colonne telegram_chat_id existe
    $checkChatIdColumn = $pdo->query("SHOW COLUMNS FROM `users` LIKE 'telegram_chat_id'");
    if ($checkChatIdColumn->rowCount() == 0) {
        $pdo->exec("ALTER TABLE `users` ADD `telegram_chat_id` VARCHAR(255) NULL DEFAULT NULL;");
        echo "Colonne 'telegram_chat_id' ajoutée.<br>";
    } else {
        echo "Colonne 'telegram_chat_id' existe déjà.<br>";
    }

    // Vérifier si la colonne telegram_notifications existe
    $checkNotificationsColumn = $pdo->query("SHOW COLUMNS FROM `users` LIKE 'telegram_notifications'");
    if ($checkNotificationsColumn->rowCount() == 0) {
        $pdo->exec("ALTER TABLE `users` ADD `telegram_notifications` TINYINT(1) NOT NULL DEFAULT 0;");
        echo "Colonne 'telegram_notifications' ajoutée.<br>";
    } else {
        echo "Colonne 'telegram_notifications' existe déjà.<br>";
    }

    echo "Migration pour Telegram terminée avec succès.";

} catch (PDOException $e) {
    die("Erreur de migration : " . $e->getMessage());
}
