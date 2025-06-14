<?php
// Test spécifique pour la réinitialisation avec une vraie adresse email
require_once 'api/config.php';
require_once 'api/utils.php';

echo "=== TEST RÉINITIALISATION AVEC VRAIE ADRESSE ===\n";

$realEmail = 'aahmadooo997@gmail.com';

echo "Test avec votre adresse email: $realEmail\n";

try {
    // 1. Vérifier que l'utilisateur existe
    echo "\n1. Vérification de l'existence de l'utilisateur...\n";
    $stmt = $pdo->prepare("SELECT id, username, first_name, last_name, email FROM users WHERE email = ?");
    $stmt->execute([$realEmail]);
    $user = $stmt->fetch();
    
    if (!$user) {
        echo "❌ Utilisateur non trouvé avec cet email\n";
        exit(1);
    }
    
    echo "✅ Utilisateur trouvé:\n";
    echo "   - ID: " . $user['id'] . "\n";
    echo "   - Username: " . $user['username'] . "\n";
    echo "   - Nom: " . $user['first_name'] . " " . $user['last_name'] . "\n";
    echo "   - Email: " . $user['email'] . "\n";
    
    // 2. Générer et sauvegarder le token
    echo "\n2. Génération du token de réinitialisation...\n";
    $resetToken = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    $stmt = $pdo->prepare("UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?");
    $result = $stmt->execute([$resetToken, $expiresAt, $user['id']]);
    
    if ($result) {
        echo "✅ Token sauvegardé en base\n";
        echo "   - Token: " . substr($resetToken, 0, 20) . "...\n";
        echo "   - Expire le: $expiresAt\n";
    } else {
        echo "❌ Erreur lors de la sauvegarde du token\n";
        exit(1);
    }
    
    // 3. Créer l'URL de réinitialisation
    $resetUrl = 'https://rappelanniv.aa-world.store/front/index.html?reset_token=' . $resetToken;
    
    $userName = trim($user['first_name'] . ' ' . $user['last_name']);
    if (empty($userName)) {
        $userName = $user['username'] ?: 'Utilisateur';
    }
    
    // 4. Créer le message HTML
    $subject = 'Réinitialisation de votre mot de passe - Birthday Reminder';
    $message = '
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h2 style="color: #4361ee; margin-bottom: 20px;">Réinitialisation de mot de passe</h2>
        <p>Bonjour ' . htmlspecialchars($userName) . ',</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Birthday Reminder.</p>
        <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="' . $resetUrl . '" 
               style="background-color: #4361ee; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
                Réinitialiser mon mot de passe
            </a>
        </div>
        <p><strong>Important :</strong> Ce lien expirera dans 1 heure pour des raisons de sécurité.</p>
        <p>Si vous n\'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e9ecef;">
        <p style="font-size: 12px; color: #6c757d;">
            Birthday Reminder - Système de gestion d\'anniversaires<br>
            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
    </div>
</body>
</html>';
    
    echo "\n3. Test d'envoi d'email de réinitialisation...\n";
    echo "Destinataire: $realEmail\n";
    echo "Sujet: $subject\n";
    echo "URL de réinitialisation: $resetUrl\n";
    
    // 5. Tenter l'envoi
    $emailSent = sendEmail($realEmail, $subject, $message);
    
    if ($emailSent) {
        echo "✅ Email de réinitialisation envoyé avec succès!\n";
        echo "Vérifiez votre boîte mail (et les spams) dans quelques minutes.\n";
    } else {
        echo "❌ Échec de l'envoi de l'email de réinitialisation\n";
        echo "Vérifiez les logs d'erreur pour plus de détails.\n";
    }
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== FIN DU TEST ===\n";
