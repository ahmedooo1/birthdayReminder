<?php
echo "=== TEST DE LA CONFIGURATION ENV EN PRODUCTION ===\n\n";

$url = "https://rappelanniv.aa-world.store/api/config.php";

echo "Test 1 : Vérification de la configuration de base\n";
echo "URL testée : $url\n\n";

// Test de la configuration
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Code HTTP : $httpCode\n";
echo "Réponse :\n$response\n\n";

// Test 2 : Créer un endpoint de debug temporaire
echo "=== CRÉATION D'UN ENDPOINT DE DEBUG ===\n";

$debugContent = '<?php
require_once "config.php";

header("Content-Type: application/json");

$debug_info = [
    "env_file_exists" => file_exists(".env"),
    "birthday_api_key" => env("BIRTHDAY_REMINDER_API_KEY", "NOT_FOUND"),
    "mail_host" => env("MAIL_HOST", "NOT_FOUND"),
    "app_base_url" => env("APP_BASE_URL", "NOT_FOUND"),
    "timestamp" => date("Y-m-d H:i:s")
];

echo json_encode($debug_info, JSON_PRETTY_PRINT);
?>';

file_put_contents('debug_env.php', $debugContent);
echo "✅ Fichier debug_env.php créé\n";
echo "Uploadez ce fichier à la racine de votre site et testez :\n";
echo "https://rappelanniv.aa-world.store/debug_env.php\n\n";

echo "=== FIN DU TEST ===\n";
?>
