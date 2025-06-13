<?php
/**
 * Script de configuration de la base de données MySQL
 * 
 * Ce script crée la base de données et l'utilisateur MySQL si nécessaire
 */

// Afficher les erreurs pour le débogage
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Charger les variables d'environnement
require_once __DIR__ . '/../api/env.php';

echo "=== Configuration de la base de données MySQL ===\n\n";

// Configuration MySQL
$host = env('MYSQL_HOST', 'localhost');
$port = env('MYSQL_PORT', 3306);
$database = env('MYSQL_DATABASE', 'birthday_reminder');
$user = env('MYSQL_USER', 'root');
$password = env('MYSQL_PASSWORD', '');

// Connexion à MySQL sans spécifier de base de données
try {
    echo "Connexion à MySQL...\n";
    $dsn = "mysql:host=$host;port=$port;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Créer la base de données si elle n'existe pas
    echo "Création de la base de données '$database' si elle n'existe pas...\n";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$database` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "Base de données créée ou déjà existante.\n";
    
    // Sélectionner la base de données
    $pdo->exec("USE `$database`");
    
    // Exécuter le script SQL de création des tables
    echo "Exécution du script SQL de création des tables...\n";
    $sql = file_get_contents(__DIR__ . '/mysql_schema.sql');
    
    // Diviser le script en requêtes individuelles
    $queries = explode(';', $sql);
    
    foreach ($queries as $query) {
        $query = trim($query);
        if (!empty($query)) {
            try {
                $pdo->exec($query);
            } catch (PDOException $e) {
                echo "Erreur lors de l'exécution de la requête: " . $e->getMessage() . "\n";
                echo "Requête: " . $query . "\n";
            }
        }
    }
    
    echo "Tables créées avec succès.\n";
    
    // Vérifier si les tables ont été créées
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Tables dans la base de données:\n";
    foreach ($tables as $table) {
        echo "- $table\n";
    }
    
    echo "\nConfiguration de la base de données MySQL terminée avec succès!\n";
    
} catch (PDOException $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
    exit(1);
}

