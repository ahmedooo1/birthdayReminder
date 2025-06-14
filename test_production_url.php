<?php
echo "=== TEST DE L'URL DE PRODUCTION ===\n\n";

$url = "https://rappelanniv.aa-world.store/api/auto_birthday_reminders.php?api_key=bd_12345_auto_reminder_secret_key_change_this";

echo "URL testée : $url\n\n";

// Initialiser cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Pour les tests seulement

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
