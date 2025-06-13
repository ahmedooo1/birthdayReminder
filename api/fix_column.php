<?php
header('Content-Type: application/json');

try {
    // Configuration directe de la base de données
    $dsn = "mysql:host=localhost;dbname=birthday_reminder;port=3306;charset=utf8mb4";
    $username = "root";
    $password = "";
    
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
    ]);
    
    $response = ['success' => true, 'steps' => []];
    
    // Étape 1 : Vérifier la table users
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    if ($stmt->rowCount() > 0) {
        $response['steps'][] = 'Table users trouvée';
        
        // Étape 2 : Vérifier les colonnes existantes
        $stmt = $pdo->query("DESCRIBE users");
        $columns = $stmt->fetchAll();
        
        $columnNames = array_column($columns, 'Field');
        $response['current_columns'] = $columnNames;
        
        // Étape 3 : Vérifier si system_notifications_enabled existe
        if (in_array('system_notifications_enabled', $columnNames)) {
            $response['steps'][] = 'Colonne system_notifications_enabled déjà présente';
        } else {
            $response['steps'][] = 'Colonne system_notifications_enabled manquante, ajout en cours...';
            
            // Ajouter la colonne
            $pdo->exec("ALTER TABLE users ADD COLUMN system_notifications_enabled TINYINT(1) DEFAULT 1");
            $response['steps'][] = 'Colonne system_notifications_enabled ajoutée avec succès';
            
            // Vérifier que l'ajout a fonctionné
            $stmt = $pdo->query("DESCRIBE users");
            $newColumns = $stmt->fetchAll();
            $newColumnNames = array_column($newColumns, 'Field');
            
            if (in_array('system_notifications_enabled', $newColumnNames)) {
                $response['steps'][] = 'Vérification réussie : colonne présente';
                $response['new_columns'] = $newColumnNames;
            } else {
                $response['success'] = false;
                $response['error'] = 'Échec de l\'ajout de la colonne';
            }
        }
        
    } else {
        $response['success'] = false;
        $response['error'] = 'Table users non trouvée';
    }
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}
?>
