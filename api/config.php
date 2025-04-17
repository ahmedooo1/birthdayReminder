<?php
// Configuration de la base de données
$host = 'localhost';
$dbname = 'birthday_reminder';
$username = 'root';
$password = '';

// Connexion à la base de données
try {
$pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
die("Erreur de connexion à la base de données: " . $e->getMessage());
}

// Fonction pour générer une réponse JSON
function sendResponse($data, $status = 200) {
header('Content-Type: application/json');
http_response_code($status);
echo json_encode($data);
exit;
}

// Fonction pour vérifier si la requête est autorisée
function checkAuth() {
// Vous pouvez implémenter une authentification plus robuste ici
// Pour l'instant, nous utilisons une simple clé API
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
if ($apiKey !== 'votre_cle_api_secrete') {
sendResponse(['error' => 'Non autorisé'], 401);
}
}