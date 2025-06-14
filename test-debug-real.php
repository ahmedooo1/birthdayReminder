<?php
// Test direct de l'API forgot_password avec debug

$email = 'aahmadooo997@gmail.com'; // Remplacez par votre email si besoin

$data = json_encode(['email' => $email]);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://rappelanniv.aa-world.store/api/auth.php?action=forgot_password&debug=1');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "=== TEST FORGOT PASSWORD AVEC DEBUG ===\n";
echo "Email testé: $email\n";
echo "Code HTTP: $httpCode\n";
echo "Erreur cURL: " . ($error ?: 'Aucune') . "\n";
echo "Réponse JSON:\n";
echo json_encode(json_decode($response), JSON_PRETTY_PRINT);
echo "\n";

// Analyser la réponse
$data = json_decode($response, true);
if (isset($data['debug'])) {
    echo "\n=== DÉTAILS DEBUG ===\n";
    echo "Email: {$data['debug']['email']}\n";
    echo "Méthode: {$data['debug']['method']}\n";
    echo "Utilisateur trouvé: " . ($data['debug']['user_found'] ? 'OUI' : 'NON') . "\n";
    
    if (isset($data['debug']['mail_config'])) {
        echo "\n--- Configuration Email ---\n";
        echo "Host: {$data['debug']['mail_config']['MAIL_HOST']}\n";
        echo "Port: {$data['debug']['mail_config']['MAIL_PORT']}\n";
        echo "Username: {$data['debug']['mail_config']['MAIL_USERNAME']}\n";
        echo "From: {$data['debug']['mail_config']['MAIL_FROM_ADDRESS']}\n";
        echo "Encryption: {$data['debug']['mail_config']['MAIL_ENCRYPTION']}\n";
    }
    
    echo "\nEmail envoyé: " . ($data['debug']['email_sent'] ? 'OUI' : 'NON') . "\n";
}
