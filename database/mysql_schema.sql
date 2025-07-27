-- Script d'initialisation de la base de données MySQL pour Birthday Reminder
-- Ce script crée les tables nécessaires pour l'application

-- Créer la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS birthday_reminder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Utiliser la base de données
USE birthday_reminder;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email_notifications TINYINT(1) DEFAULT 1,
    notification_days INT DEFAULT 3,
    system_notifications_enabled TINYINT(1) DEFAULT 1, -- Added this line
    email_verified TINYINT(1) DEFAULT 0,
    email_verification_token VARCHAR(255) NULL,
    reset_token VARCHAR(255) NULL,
    reset_token_expires DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des groupes
CREATE TABLE IF NOT EXISTS groupes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#4361ee',
    access_code VARCHAR(20) UNIQUE,
    owner_id VARCHAR(50) NOT NULL,
    is_private TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des membres de groupes
CREATE TABLE IF NOT EXISTS group_members (
    id VARCHAR(50) PRIMARY KEY,
    group_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groupes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(group_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des anniversaires
CREATE TABLE IF NOT EXISTS birthdays (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    group_id VARCHAR(50) NOT NULL,
    created_by VARCHAR(50) NOT NULL,
    notes TEXT,
    notification_sent TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groupes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    birthday_id VARCHAR(50),
    type VARCHAR(20) DEFAULT 'birthday',
    is_read TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (birthday_id) REFERENCES birthdays(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des paramètres globaux
CREATE TABLE IF NOT EXISTS app_settings (
    id INT PRIMARY KEY DEFAULT 1,
    app_name VARCHAR(100) DEFAULT 'Birthday Reminder',
    email_host VARCHAR(100) DEFAULT 'smtp.gmail.com',
    email_port INT DEFAULT 587,
    email_username VARCHAR(100),
    email_password VARCHAR(100),
    email_from_name VARCHAR(100) DEFAULT 'Birthday Reminder'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insérer les paramètres par défaut s'ils n'existent pas
INSERT IGNORE INTO app_settings (id) VALUES (1);

-- Créer un utilisateur de démonstration si aucun n'existe
INSERT IGNORE INTO users (id, username, email, password_hash, first_name, last_name, created_at)
SELECT 'admin_demo', 'admin', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users LIMIT 1);

-- Créer un groupe de démonstration si aucun n'existe
INSERT IGNORE INTO groupes (id, name, description, color, access_code, owner_id, created_at)
SELECT 'family_demo', 'Famille', 'Groupe pour les anniversaires de la famille', '#4361ee', 'FAM123', 'admin_demo', NOW()
WHERE NOT EXISTS (SELECT 1 FROM groupes LIMIT 1);

-- Ajouter l'admin comme membre du groupe de démonstration
INSERT IGNORE INTO group_members (id, group_id, user_id, joined_at)
SELECT 'member_demo', 'family_demo', 'admin_demo', NOW()
WHERE NOT EXISTS (SELECT 1 FROM group_members LIMIT 1);

-- Ajouter quelques anniversaires de démonstration
INSERT IGNORE INTO birthdays (id, name, date, group_id, created_by, notes, created_at)
SELECT 'birthday_demo1', 'Marie Dupont', '1985-06-15', 'family_demo', 'admin_demo', 'Aime les chocolats', NOW()
WHERE NOT EXISTS (SELECT 1 FROM birthdays WHERE id = 'birthday_demo1');

INSERT IGNORE INTO birthdays (id, name, date, group_id, created_by, notes, created_at)
SELECT 'birthday_demo2', 'Jean Martin', '1990-03-22', 'family_demo', 'admin_demo', 'Fan de football', NOW()
WHERE NOT EXISTS (SELECT 1 FROM birthdays WHERE id = 'birthday_demo2');

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_birthdays_date ON birthdays(date);
CREATE INDEX IF NOT EXISTS idx_birthdays_group_id ON birthdays(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

