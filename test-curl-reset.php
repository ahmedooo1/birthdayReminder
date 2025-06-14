<?php
// Test direct de l'API de réinitialisation avec curl
$email = 'aahmadooo997@gmail.com';

echo "=== TEST DIRECT API FORGOT PASSWORD ===\n";
echo "Email testé: $email\n\n";

// Préparer les données
$data = json_encode(['email' => $email]);

// Configuration curl
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://rappelanniv.aa-world.store/api/auth.php?action=forgot_password');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Content-Length: ' . strlen($data)
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_VERBOSE, true);

// Capturer les informations de debug
$verbose = fopen('php://temp', 'w+');
curl_setopt($ch, CURLOPT_STDERR, $verbose);

// Exécuter la requête
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
$info = curl_getinfo($ch);

// Récupérer les informations de debug
rewind($verbose);
$verboseLog = stream_get_contents($verbose);

curl_close($ch);
fclose($verbose);

// Afficher les résultats
echo "Code HTTP: $httpCode\n";
echo "Erreur cURL: " . ($error ?: 'Aucune') . "\n";
echo "Temps de réponse: " . $info['total_time'] . "s\n";
echo "Taille de la réponse: " . strlen($response) . " bytes\n";

echo "\nRéponse brute:\n";
echo $response . "\n";

echo "\nRéponse décodée:\n";
$decoded = json_decode($response, true);
if ($decoded) {
    print_r($decoded);
} else {
    echo "Impossible de décoder la réponse JSON\n";
}

echo "\nInformations de debug curl:\n";
echo $verboseLog;

echo "\n=== FIN DU TEST ===\n";
