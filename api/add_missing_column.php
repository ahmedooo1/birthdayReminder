<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Configuration directe MySQL
    $dsn = "mysql:host=localhost;dbname=birthday_reminder;port=3306;charset=utf8mb4";
    $username = "root";
    $password = "";
    
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
    ]);
    
    echo "Connexion MySQL réussie\n";
    
    // Vérifier la structure actuelle
    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
    
    echo "Colonnes actuelles: " . implode(', ', $columns) . "\n";
    
    // Vérifier si la colonne existe
    if (in_array('system_notifications_enabled', $columns)) {
        echo "✓ La colonne system_notifications_enabled existe déjà\n";
    } else {
        echo "⚠ Ajout de la colonne system_notifications_enabled...\n";
        
        // Ajouter la colonne
        $sql = "ALTER TABLE users ADD COLUMN system_notifications_enabled TINYINT(1) DEFAULT 1";
        $pdo->exec($sql);
        
        echo "✓ Colonne ajoutée avec succès\n";
        
        // Vérifier à nouveau
        $stmt = $pdo->query("DESCRIBE users");
        $newColumns = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
        
        if (in_array('system_notifications_enabled', $newColumns)) {
            echo "✓ Vérification réussie - colonne présente\n";
        } else {
            echo "✗ Erreur - colonne toujours manquante\n";
        }
    }
    
    // Afficher la structure finale
    echo "\nStructure finale de la table users:\n";
    $stmt = $pdo->query("DESCRIBE users");
    $finalColumns = $stmt->fetchAll();
    
    foreach ($finalColumns as $col) {
        echo "- {$col['Field']} ({$col['Type']}) - Default: {$col['Default']}\n";
    }
    
    echo "\n✓ Opération terminée avec succès\n";
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
?>
