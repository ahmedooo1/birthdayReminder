<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'config.php';

try {
    echo "Ajout de la colonne system_notifications_enabled...\n";
    
    // Vérifier si la colonne existe déjà
    $stmt = $pdo->query('DESCRIBE users');
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $hasColumn = false;
    foreach ($columns as $column) {
        if ($column['Field'] === 'system_notifications_enabled') {
            $hasColumn = true;
            break;
        }
    }
    
    if ($hasColumn) {
        echo "✓ La colonne 'system_notifications_enabled' existe déjà\n";
    } else {
        // Ajouter la colonne
        $sql = "ALTER TABLE users ADD COLUMN system_notifications_enabled TINYINT(1) DEFAULT 1";
        $pdo->exec($sql);
        echo "✓ Colonne 'system_notifications_enabled' ajoutée avec succès\n";
        
        // Vérifier que l'ajout a fonctionné
        $stmt = $pdo->query('DESCRIBE users');
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $found = false;
        foreach ($columns as $column) {
            if ($column['Field'] === 'system_notifications_enabled') {
                $found = true;
                echo "✓ Vérification : colonne trouvée avec type {$column['Type']}\n";
                break;
            }
        }
        
        if (!$found) {
            echo "✗ Erreur : la colonne n'a pas été ajoutée correctement\n";
        }
    }
    
} catch (Exception $e) {
    echo 'Erreur: ' . $e->getMessage() . "\n";
    echo 'Trace: ' . $e->getTraceAsString() . "\n";
}
?>
