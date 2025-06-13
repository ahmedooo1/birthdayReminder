<?php
require_once 'config.php';

try {    // Création de la table des utilisateurs
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        email_notifications TINYINT(1) DEFAULT 1,
        notification_days INT DEFAULT 3,
        system_notifications_enabled TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    
    // Création de la table des groupes    $pdo->exec("CREATE TABLE IF NOT EXISTS groupes (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        color VARCHAR(20) DEFAULT '#4361ee',
        access_code VARCHAR(20) UNIQUE,
        owner_id VARCHAR(50) NOT NULL,
        is_private TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    
    // Création de la table des membres de groupes
    $pdo->exec("CREATE TABLE IF NOT EXISTS group_members (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groupes(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(group_id, user_id)
    )");

    // Création de la table des anniversaires
    $pdo->exec("CREATE TABLE IF NOT EXISTS birthdays (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        date DATE NOT NULL,
        group_id TEXT NOT NULL,
        created_by TEXT NOT NULL,
        notes TEXT,
        notification_sent INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groupes(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )");

    // Création de la table des notifications
    $pdo->exec("CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        birthday_id TEXT,
        type TEXT DEFAULT 'birthday',
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (birthday_id) REFERENCES birthdays(id) ON DELETE CASCADE
    )");

    // Création de la table des sessions
    $pdo->exec("CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        session_token TEXT NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    // Création de la table des paramètres globaux
    $pdo->exec("CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        app_name TEXT DEFAULT 'Birthday Reminder',
        email_host TEXT DEFAULT 'smtp.gmail.com',
        email_port INTEGER DEFAULT 587,
        email_username TEXT,
        email_password TEXT,
        email_from_name TEXT DEFAULT 'Birthday Reminder'
    )");

    // Insérer les paramètres par défaut s'ils n'existent pas
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM app_settings");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("INSERT INTO app_settings (id) VALUES (1)");
    }

    echo json_encode(['success' => true, 'message' => 'Tables créées avec succès']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>