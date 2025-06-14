<?php
// Test d'envoi d'email avec une vraie adresse
require_once 'api/config.php';
require_once 'api/utils.php';

// CHANGEZ CETTE ADRESSE PAR VOTRE VRAIE ADRESSE EMAIL
$votre_vraie_email = 'votre_email@gmail.com'; // <-- MODIFIEZ ICI

echo "=== TEST AVEC VRAIE ADRESSE EMAIL ===\n";
echo "Email de destination: $votre_vraie_email\n";

if ($votre_vraie_email === 'votre_email@gmail.com') {
    echo "❌ ATTENTION: Vous devez modifier la variable \$votre_vraie_email dans ce script!\n";
    echo "Changez 'votre_email@gmail.com' par votre vraie adresse email.\n";
    exit(1);
}

$subject = '🔐 Test Réinitialisation Birthday Reminder';
$message = '
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h2 style="color: #4361ee;">Test d\'envoi d\'email</h2>
        <p>Ceci est un test pour vérifier que les emails de réinitialisation fonctionnent.</p>
        <p>Si vous recevez cet email, la configuration est correcte!</p>
        <p style="font-size: 12px; color: #6c757d;">
            Test envoyé le ' . date('d/m/Y à H:i:s') . '
        </p>
    </div>
</body>
</html>';

try {
    echo "Envoi en cours...\n";
    $result = sendEmail($votre_vraie_email, $subject, $message);
    
    if ($result) {
        echo "✅ Email de test envoyé avec succès!\n";
        echo "Vérifiez votre boîte email (et le dossier spam).\n";
    } else {
        echo "❌ Échec de l'envoi d'email\n";
    }
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}

echo "\n=== FIN DU TEST ===\n";
