<?php
echo "=== TEST DES FICHIERS EXISTANTS SUR LE SERVEUR ===\n\n";

$baseUrl = "https://rappelanniv.aa-world.store/api/";
$testFiles = [
    'auth.php',
    'birthdays.php', 
    'config.php',
    'cron_send_email_reminders.php'
];

foreach ($testFiles as $file) {
    $url = $baseUrl . $file;
    echo "Test : $url\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_NOBODY, true); // HEAD request seulement
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode == 200) {
        echo "  ✅ Existe (Code: $httpCode)\n";
    } else {
        echo "  ❌ N'existe pas (Code: $httpCode)\n";
    }
}

echo "\n=== FIN DU TEST ===\n";
?>
