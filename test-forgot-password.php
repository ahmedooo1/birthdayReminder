<?php
// Test de la fonctionnalité forgot_password
$email = 'test@example.com'; // Remplacez par un email existant dans votre base

$data = json_encode(['email' => $email]);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://rappelanniv.aa-world.store/api/auth.php?action=forgot_password');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "=== TEST FORGOT PASSWORD ===\n";
echo "Email testé: $email\n";
echo "Code HTTP: $httpCode\n";
echo "Erreur cURL: " . ($error ?: 'Aucune') . "\n";
echo "Réponse: $response\n";
echo "===========================\n";
