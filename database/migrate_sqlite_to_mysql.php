<?php
/**
 * Script de migration des données de SQLite vers MySQL
 * 
 * Ce script migre toutes les données de la base SQLite vers MySQL
 */

// Afficher les erreurs pour le débogage
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Charger les variables d'environnement
require_once __DIR__ . '/../api/env.php';

echo "=== Migration des données de SQLite vers MySQL ===\n\n";

// Configuration de la base de données SQLite (source)
$sqlitePath = env('SQLITE_PATH', __DIR__ . '/../birthday_reminder.db');

// Configuration de la base de données MySQL (destination)
$mysqlHost = env('MYSQL_HOST', 'localhost');
$mysqlPort = env('MYSQL_PORT', 3306);
$mysqlDatabase = env('MYSQL_DATABASE', 'birthday_reminder');
$mysqlUser = env('MYSQL_USER', 'root');
$mysqlPassword = env('MYSQL_PASSWORD', '');

try {
    // Connexion à la base de données SQLite
    echo "Connexion à la base de données SQLite source...\n";
    $sqlite = new PDO('sqlite:' . $sqlitePath);
    $sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Connexion à la base de données MySQL
    echo "Connexion à la base de données MySQL destination...\n";
    $dsn = "mysql:host=$mysqlHost;port=$mysqlPort;dbname=$mysqlDatabase;charset=utf8mb4";
    $mysql = new PDO($dsn, $mysqlUser, $mysqlPassword);
    $mysql->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $mysql->exec("SET NAMES utf8mb4");
    
    // Désactiver les contraintes de clé étrangère dans MySQL pour la migration
    $mysql->exec("SET FOREIGN_KEY_CHECKS = 0");
    
    // Migrer les utilisateurs
    echo "Migration des utilisateurs...\n";
    migrateTable($sqlite, $mysql, 'users', [
        'id', 'username', 'email', 'password_hash', 'first_name', 'last_name',
        'email_notifications', 'notification_days', 'created_at', 'last_login'
    ]);
    
    // Migrer les groupes
    echo "Migration des groupes...\n";
    migrateTable($sqlite, $mysql, 'groupes', [
        'id', 'name', 'description', 'color', 'access_code', 'owner_id',
        'is_private', 'created_at'
    ]);
    
    // Migrer les membres de groupes
    echo "Migration des membres de groupes...\n";
    migrateTable($sqlite, $mysql, 'group_members', [
        'id', 'group_id', 'user_id', 'joined_at'
    ]);
    
    // Migrer les anniversaires
    echo "Migration des anniversaires...\n";
    migrateTable($sqlite, $mysql, 'birthdays', [
        'id', 'name', 'date', 'group_id', 'created_by', 'notes',
        'notification_sent', 'created_at'
    ]);
    
    // Migrer les notifications
    echo "Migration des notifications...\n";
    migrateTable($sqlite, $mysql, 'notifications', [
        'id', 'user_id', 'title', 'message', 'birthday_id', 'type',
        'is_read', 'created_at'
    ]);
    
    // Migrer les sessions
    echo "Migration des sessions...\n";
    migrateTable($sqlite, $mysql, 'user_sessions', [
        'id', 'user_id', 'session_token', 'expires_at', 'created_at'
    ]);
    
    // Migrer les paramètres
    echo "Migration des paramètres...\n";
    migrateTable($sqlite, $mysql, 'app_settings', [
        'id', 'app_name', 'email_host', 'email_port', 'email_username',
        'email_password', 'email_from_name'
    ]);
    
    // Réactiver les contraintes de clé étrangère
    $mysql->exec("SET FOREIGN_KEY_CHECKS = 1");
    
    echo "\nMigration terminée avec succès!\n";
    
} catch (PDOException $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
    exit(1);
}

/**
 * Migrer une table de SQLite vers MySQL
 * 
 * @param PDO $sqlite Connexion SQLite
 * @param PDO $mysql Connexion MySQL
 * @param string $table Nom de la table
 * @param array $columns Colonnes à migrer
 */
function migrateTable($sqlite, $mysql, $table, $columns) {
    try {
        // Vérifier si la table existe dans SQLite
        $stmt = $sqlite->query("SELECT name FROM sqlite_master WHERE type='table' AND name='$table'");
        if ($stmt->fetch() === false) {
            echo "  Table '$table' n'existe pas dans SQLite, ignorée.\n";
            return;
        }
        
        // Compter les enregistrements dans SQLite
        $stmt = $sqlite->query("SELECT COUNT(*) FROM $table");
        $count = $stmt->fetchColumn();
        echo "  $count enregistrements trouvés dans la table '$table'.\n";
        
        if ($count === 0) {
            echo "  Aucun enregistrement à migrer pour la table '$table'.\n";
            return;
        }
        
        // Vider la table MySQL
        $mysql->exec("DELETE FROM $table");
        
        // Construire la requête de sélection
        $selectColumns = implode(', ', $columns);
        $stmt = $sqlite->query("SELECT $selectColumns FROM $table");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Construire la requête d'insertion
        $placeholders = implode(', ', array_fill(0, count($columns), '?'));
        $insertColumns = implode(', ', $columns);
        $insertStmt = $mysql->prepare("INSERT INTO $table ($insertColumns) VALUES ($placeholders)");
        
        // Insérer les données
        $mysql->beginTransaction();
        $inserted = 0;
        
        foreach ($rows as $row) {
            $values = [];
            foreach ($columns as $column) {
                $values[] = $row[$column] ?? null;
            }
            
            $insertStmt->execute($values);
            $inserted++;
        }
        
        $mysql->commit();
        echo "  $inserted enregistrements migrés avec succès.\n";
        
    } catch (PDOException $e) {
        if ($mysql->inTransaction()) {
            $mysql->rollBack();
        }
        echo "  Erreur lors de la migration de la table '$table': " . $e->getMessage() . "\n";
    }
}

