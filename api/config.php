<?php
// Charger les variables d'environnement
require_once __DIR__ . '/env.php';

// Charger le gestionnaire d'erreurs
require_once __DIR__ . '/error_handler.php';

// Enable CORS
$allowedOrigins = [
    'https://rappelanniv.aa-world.store', // Production domain
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000', // For development
    'http://127.0.0.1:3000'  // For development
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // Pour les requêtes sans origine (comme les navigateurs mobiles)
    // ou pour des domaines non listés, utiliser un wildcard sécurisé
    if (empty($origin)) {
        header('Access-Control-Allow-Origin: https://rappelanniv.aa-world.store');
    } else {
        // Log l'origine pour debug
        error_log("CORS: Unknown origin: " . $origin);
        header('Access-Control-Allow-Origin: https://rappelanniv.aa-world.store');
    }
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400'); // Cache preflight for 24 hours

// Ajout d'headers de sécurité pour les mobiles
header('Vary: Origin');
header('X-Content-Type-Options: nosniff');

// Handle preflight requests
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200); // Explicitly set 200 OK for OPTIONS
    // Send minimal response for preflight
    echo json_encode(['status' => 'ok']);
    exit(0);
}

// Déterminer si on utilise SQLite ou MySQL
$dbType = env('DB_TYPE', 'sqlite');

if ($dbType === 'mysql') {
    // Configuration de la base de données MySQL
    $dbHost = env('MYSQL_HOST', 'localhost');
    $dbName = env('MYSQL_DATABASE', 'birthday_reminder');
    $dbUser = env('MYSQL_USER', 'root');
    $dbPassword = env('MYSQL_PASSWORD', '');
    $dbPort = env('MYSQL_PORT', 3306);

    // Connexion à la base de données MySQL
    try {
        $dsn = "mysql:host=$dbHost;port=$dbPort;dbname=$dbName;charset=utf8mb4";
        $pdo = new PDO($dsn, $dbUser, $dbPassword);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false); // Disable emulated prepares
        $pdo->exec("SET NAMES utf8mb4");
    } catch (PDOException $e) {
        throw new DatabaseError("Erreur de connexion à la base de données MySQL: " . $e->getMessage());
    }
} else {
    // Configuration de la base de données SQLite
    $dbPath = env('SQLITE_PATH', __DIR__ . '/../birthday_reminder.db');
    
    // Connexion à la base de données SQLite
    try {
        $pdo = new PDO('sqlite:' . $dbPath);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        
        // Activer les contraintes de clé étrangère
        $pdo->exec('PRAGMA foreign_keys = ON');
    } catch (PDOException $e) {
        throw new DatabaseError("Erreur de connexion à la base de données SQLite: " . $e->getMessage());
    }
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
    $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    $expectedApiKey = env('API_KEY', 'votre_cle_api_secrete');
    
    if ($apiKey !== $expectedApiKey) {
        throw new AuthorizationError('Non autorisé');
    }
}