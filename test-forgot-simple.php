<?php
// Test simplifié de l'API forgot_password
require_once 'api/config.php';

echo "=== TEST SIMPLIFIÉ FORGOT PASSWORD ===\n";

try {
    // Tester la connexion à la base de données
    if (!$pdo) {
        throw new Exception("Pas de connexion à la base de données");
    }
    echo "✅ Connexion DB OK\n";
    
    // Vérifier qu'un utilisateur existe
    $stmt = $pdo->query("SELECT id, email, first_name, last_name FROM users LIMIT 1");
    $user = $stmt->fetch();
    
    if (!$user) {
        echo "❌ Aucun utilisateur trouvé dans la base\n";
        exit(1);
    }
    
    echo "✅ Utilisateur test trouvé: " . $user['email'] . "\n";
    
    // Tester la génération d'un token
    $resetToken = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    echo "✅ Token généré: " . substr($resetToken, 0, 20) . "...\n";
    echo "✅ Expiration: $expiresAt\n";
    
    // Tester la mise à jour en base (simulation)
    $stmt = $pdo->prepare("UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?");
    $result = $stmt->execute([$resetToken, $expiresAt, $user['id']]);
    
    if ($result) {
        echo "✅ Token sauvegardé en base\n";
    } else {
        echo "❌ Erreur lors de la sauvegarde du token\n";
    }
    
    // Vérifier la fonction sendEmail
    require_once 'api/utils.php';
    
    // Vérifier la configuration email
    $emailHost = env('MAIL_HOST', '');
    $emailUsername = env('MAIL_USERNAME', '');
    $emailPassword = env('MAIL_PASSWORD', '');
    
    echo "\n--- Configuration Email ---\n";
    echo "Host: " . ($emailHost ?: 'NON CONFIGURÉ') . "\n";
    echo "Username: " . ($emailUsername ?: 'NON CONFIGURÉ') . "\n";
    echo "Password: " . ($emailPassword ? 'CONFIGURÉ' : 'NON CONFIGURÉ') . "\n";
    
    if (empty($emailUsername) || empty($emailPassword)) {
        echo "❌ Configuration email incomplète - c'est probablement la cause de l'erreur 500\n";
    } else {
        echo "✅ Configuration email OK\n";
    }
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== FIN DU TEST ===\n";
