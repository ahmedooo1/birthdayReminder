<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Configuration directe MySQL (adapter si besoin)
    $dsn = "mysql:host=localhost;dbname=birthday_reminder;port=3306;charset=utf8mb4";
    $username = "root";
    $password = "";

    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
    ]);

    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);

    $changes = [];

    if (!in_array('phone_number', $columns)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN phone_number VARCHAR(30) NULL AFTER system_notifications_enabled");
        $changes[] = 'Ajout colonne phone_number';
    }

    if (!in_array('sms_notifications', $columns)) {
        $pdo->exec("ALTER TABLE users ADD COLUMN sms_notifications TINYINT(1) DEFAULT 0 AFTER phone_number");
        $changes[] = 'Ajout colonne sms_notifications';
    }

    // Ajouter les champs Twilio dans app_settings si non présents
    $stmt = $pdo->query("DESCRIBE app_settings");
    $appCols = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);

    if (!in_array('twilio_account_sid', $appCols)) {
        $pdo->exec("ALTER TABLE app_settings ADD COLUMN twilio_account_sid VARCHAR(100) NULL");
        $changes[] = 'Ajout app_settings.twilio_account_sid';
    }
    if (!in_array('twilio_auth_token', $appCols)) {
        $pdo->exec("ALTER TABLE app_settings ADD COLUMN twilio_auth_token VARCHAR(100) NULL");
        $changes[] = 'Ajout app_settings.twilio_auth_token';
    }
    if (!in_array('twilio_from_number', $appCols)) {
        $pdo->exec("ALTER TABLE app_settings ADD COLUMN twilio_from_number VARCHAR(30) NULL");
        $changes[] = 'Ajout app_settings.twilio_from_number';
    }

    echo json_encode([
        'status' => 'ok',
        'changes' => $changes,
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
    ]);
}
