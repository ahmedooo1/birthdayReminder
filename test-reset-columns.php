<?php
// Test des colonnes reset_token
require_once 'api/config.php';

echo "=== VÉRIFICATION DES COLONNES RESET TOKEN ===\n";

try {
    // Vérifier les colonnes de la table users
    echo "1. Vérification de la structure de la table users...\n";
    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $hasResetToken = false;
    $hasResetTokenExpires = false;
    
    echo "Colonnes existantes:\n";
    foreach ($columns as $column) {
        echo "   - " . $column['Field'] . " (" . $column['Type'] . ")\n";
        if ($column['Field'] === 'reset_token') {
            $hasResetToken = true;
        }
        if ($column['Field'] === 'reset_token_expires') {
            $hasResetTokenExpires = true;
        }
    }
    
    echo "\n2. État des colonnes reset:\n";
    echo "   - reset_token: " . ($hasResetToken ? "✅ Existe" : "❌ Manquante") . "\n";
    echo "   - reset_token_expires: " . ($hasResetTokenExpires ? "✅ Existe" : "❌ Manquante") . "\n";
    
    // Ajouter les colonnes manquantes si nécessaire
    if (!$hasResetToken || !$hasResetTokenExpires) {
        echo "\n3. Ajout des colonnes manquantes...\n";
        
        if (!$hasResetToken) {
            echo "   Ajout de reset_token...\n";
            $pdo->exec("ALTER TABLE users ADD COLUMN reset_token VARCHAR(64) NULL");
            echo "   ✅ reset_token ajoutée\n";
        }
        
        if (!$hasResetTokenExpires) {
            echo "   Ajout de reset_token_expires...\n";
            $pdo->exec("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME NULL");
            echo "   ✅ reset_token_expires ajoutée\n";
        }
        
        echo "   Toutes les colonnes ont été ajoutées avec succès!\n";
    } else {
        echo "\n3. ✅ Toutes les colonnes nécessaires sont présentes.\n";
    }
    
    echo "\n=== TEST TERMINÉ ===\n";
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}
