<?php
/**
 * Script pour vérifier et corriger les dates d'anniversaire invalides
 * Utilisation: php fix_invalid_dates.php
 */

require_once 'api/config.php';

echo "🔍 Vérification des dates d'anniversaire invalides...\n\n";

try {
    // Récupérer tous les anniversaires
    $stmt = $pdo->query("SELECT id, name, date FROM birthdays ORDER BY name");
    $birthdays = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($birthdays)) {
        echo "✅ Aucun anniversaire trouvé dans la base de données.\n";
        exit(0);
    }
    
    $invalidCount = 0;
    $invalidBirthdays = [];
    
    foreach ($birthdays as $birthday) {
        try {
            $dateObj = new DateTime($birthday['date']);
            
            // Vérifier si la date est valide
            if ($dateObj->format('Y-m-d') !== $birthday['date']) {
                $invalidCount++;
                $invalidBirthdays[] = $birthday;
                echo "❌ Date invalide trouvée:\n";
                echo "   - ID: {$birthday['id']}\n";
                echo "   - Nom: {$birthday['name']}\n";
                echo "   - Date: {$birthday['date']}\n\n";
            } else {
                echo "✅ {$birthday['name']} - {$birthday['date']} (valide)\n";
            }
        } catch (Exception $e) {
            $invalidCount++;
            $invalidBirthdays[] = $birthday;
            echo "❌ Date invalide trouvée:\n";
            echo "   - ID: {$birthday['id']}\n";
            echo "   - Nom: {$birthday['name']}\n";
            echo "   - Date: {$birthday['date']}\n";
            echo "   - Erreur: {$e->getMessage()}\n\n";
        }
    }
    
    echo "\n📊 Résumé:\n";
    echo "   - Total d'anniversaires: " . count($birthdays) . "\n";
    echo "   - Dates valides: " . (count($birthdays) - $invalidCount) . "\n";
    echo "   - Dates invalides: " . $invalidCount . "\n\n";
    
    if ($invalidCount > 0) {
        echo "⚠️  Des dates invalides ont été trouvées.\n";
        echo "   Ces anniversaires ne seront pas affichés correctement dans l'application.\n";
        echo "   Vous devez corriger manuellement ces dates dans la base de données.\n\n";
        
        echo "📝 Liste des anniversaires à corriger:\n";
        foreach ($invalidBirthdays as $birthday) {
            echo "   - {$birthday['name']} (ID: {$birthday['id']}) - Date: {$birthday['date']}\n";
        }
        
        echo "\n💡 Suggestions de correction:\n";
        echo "   1. Connectez-vous à votre base de données\n";
        echo "   2. Exécutez une requête UPDATE pour corriger les dates\n";
        echo "   3. Exemple: UPDATE birthdays SET date = '1990-01-01' WHERE id = 'birthday_id';\n";
        echo "   4. Relancez ce script pour vérifier les corrections\n";
    } else {
        echo "🎉 Toutes les dates d'anniversaire sont valides !\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Erreur de base de données: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "❌ Erreur générale: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n✨ Vérification terminée.\n";
?>
