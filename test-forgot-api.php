<?php
// Test direct de l'API forgot_password
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== TEST API FORGOT PASSWORD ===\n";

// Simuler la requête comme le fait le front-end
$testEmail = 'test@example.com'; // Vous pouvez changer cet email

// Préparer les données JSON comme le fait auth-manager.js
$jsonData = json_encode(['email' => $testEmail]);

echo "Données envoyées: $jsonData\n";

// Simuler l'appel API
$_SERVER['REQUEST_METHOD'] = 'POST';
$_GET['action'] = 'forgot_password';

// Simuler le contenu POST JSON
$_POST = []; // Vider $_POST car on utilise JSON
file_put_contents('php://input', $jsonData);

// Capturer la sortie de l'API
ob_start();

try {
    // Inclure l'API
    require_once 'api/auth.php';
} catch (Exception $e) {
    echo "❌ Erreur lors de l'exécution de l'API: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

$output = ob_get_clean();

echo "Sortie de l'API:\n";
echo $output;
echo "\n=== FIN DU TEST ===\n";
