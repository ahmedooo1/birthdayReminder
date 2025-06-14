<?php
// Test de l'API avec gestion d'erreur améliorée
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

echo "=== TEST API AVEC ERREURS ===\n";

// Simuler une requête forgot_password directement
$email = 'admin@example.com'; // Email qui existe selon notre test précédent

echo "Test avec email: $email\n";

try {
    // Simuler l'appel de l'API de façon plus réaliste
    $url = 'https://rappelanniv.aa-world.store/api/auth.php?action=forgot_password';
    
    $data = json_encode(['email' => $email]);
    
    $options = [
        'http' => [
            'header'  => "Content-type: application/json\r\n",
            'method'  => 'POST',
            'content' => $data
        ]
    ];
    
    $context = stream_context_create($options);
    $result = @file_get_contents($url, false, $context);
    
    if ($result === FALSE) {
        echo "❌ Erreur lors de l'appel à l'API\n";
        $error = error_get_last();
        if ($error) {
            echo "Dernière erreur: " . $error['message'] . "\n";
        }
    } else {
        echo "✅ Réponse reçue:\n";
        echo $result . "\n";
        
        $decoded = json_decode($result, true);
        if ($decoded) {
            echo "Statut: " . ($decoded['success'] ? 'Succès' : 'Échec') . "\n";
            echo "Message: " . ($decoded['message'] ?? $decoded['error'] ?? 'Aucun message') . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Exception: " . $e->getMessage() . "\n";
}

echo "\n=== FIN DU TEST ===\n";
