<?php
require_once 'config.php';

try {
// Création de la table des groupes
$pdo->exec("CREATE TABLE IF NOT EXISTS groups (
id VARCHAR(36) PRIMARY KEY,
name VARCHAR(255) NOT NULL,
description TEXT,
color VARCHAR(20) DEFAULT '#4361ee'
)");

// Création de la table des anniversaires
$pdo->exec("CREATE TABLE IF NOT EXISTS birthdays (
id VARCHAR(36) PRIMARY KEY,
name VARCHAR(255) NOT NULL,
date DATE NOT NULL,
group_id VARCHAR(36),
notes TEXT,
FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
)");

// Création de la table des notifications
$pdo->exec("CREATE TABLE IF NOT EXISTS notifications (
id VARCHAR(36) PRIMARY KEY,
title VARCHAR(255) NOT NULL,
message TEXT NOT NULL,
birthday_id VARCHAR(36),
date DATETIME NOT NULL,
read BOOLEAN DEFAULT FALSE,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (birthday_id) REFERENCES birthdays(id) ON DELETE CASCADE
)");

// Création de la table des paramètres
$pdo->exec("CREATE TABLE IF NOT EXISTS settings (
id INT PRIMARY KEY DEFAULT 1,
notification_days INT DEFAULT 3,
enable_notifications BOOLEAN DEFAULT TRUE
)");

// Insérer les paramètres par défaut s'ils n'existent pas
$stmt = $pdo->prepare("SELECT COUNT(*) FROM settings");
$stmt->execute();
if ($stmt->fetchColumn() == 0) {
$pdo->exec("INSERT INTO settings (id, notification_days, enable_notifications) VALUES (1, 3, TRUE)");
}

echo json_encode(['success' => true, 'message' => 'Tables créées avec succès']);
} catch (PDOException $e) {
echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}