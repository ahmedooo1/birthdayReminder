<?php
echo "=== TEST DIRECT SANS CLE API ===\n\n";

$url = "https://rappelanniv.aa-world.store/api/auto_birthday_reminders_no_key.php";
echo "URL testée : $url\n\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "Code HTTP : $httpCode\n";

if ($error) {
    echo "❌ Erreur cURL : $error\n";
} else {
    echo "✅ Requête réussie !\n\n";
    echo "Réponse :\n";
    echo "=====================================\n";
    echo $response;
    echo "\n=====================================\n";
}

echo "\n=== FIN DU TEST ===\n";
?>
