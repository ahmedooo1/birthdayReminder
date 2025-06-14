<?php
// Test spécifique de l'envoi d'email
require_once 'api/config.php';
require_once 'api/utils.php';

echo "=== TEST CONFIGURATION EMAIL ===\n";

// Vérifier la configuration
$emailHost = env('MAIL_HOST', '');
$emailPort = env('MAIL_PORT', '');
$emailUsername = env('MAIL_USERNAME', '');
$emailPassword = env('MAIL_PASSWORD', '');
$emailFromAddress = env('MAIL_FROM_ADDRESS', '');
$emailFromName = env('MAIL_FROM_NAME', '');
$emailEncryption = env('MAIL_ENCRYPTION', '');

echo "Configuration actuelle:\n";
echo "- Host: $emailHost\n";
echo "- Port: $emailPort\n";
echo "- Username: $emailUsername\n";
echo "- Password: " . (empty($emailPassword) ? 'VIDE' : 'CONFIGURÉ (' . strlen($emailPassword) . ' caractères)') . "\n";
echo "- From Address: $emailFromAddress\n";
echo "- From Name: $emailFromName\n";
echo "- Encryption: $emailEncryption\n";

echo "\n=== TEST D'ENVOI D'EMAIL ===\n";

$testEmail = 'aahmadooo997@gmail.com'; // Changez par votre vraie adresse email pour tester
$subject = 'Test Email - Birthday Reminder';
$message = 'Ceci est un email de test pour vérifier la configuration.';

echo "Tentative d'envoi à: $testEmail\n";

try {
    $result = sendEmail($testEmail, $subject, $message);
    
    if ($result) {
        echo "✅ Email envoyé avec succès!\n";
    } else {
        echo "❌ Échec de l'envoi d'email\n";
    }
    
} catch (Exception $e) {
    echo "❌ Erreur lors de l'envoi: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== VÉRIFICATION DES LOGS ===\n";
echo "Vérifiez les logs d'erreur PHP pour plus de détails sur l'échec d'envoi.\n";
echo "Les erreurs d'envoi d'email sont loggées avec error_log().\n";

echo "\n=== FIN DU TEST ===\n";
