<?php
require_once 'config.php';
require_once 'auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// RÉCUPÉRER LES PARAMÈTRES UTILISATEUR
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $sessionToken = $_GET['session_token'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? null;
        
        if (!$sessionToken) {
            sendResponse(['error' => 'Session requise'], 401);
        }
        
        // Enlever "Bearer " si présent
        if (strpos($sessionToken, 'Bearer ') === 0) {
            $sessionToken = substr($sessionToken, 7);
        }
        
        $user = verifySession($sessionToken);
        
        if (!$user) {
            sendResponse(['error' => 'Session invalide'], 401);
        }

        // Récupérer les paramètres utilisateur
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$user['user_id']]);
        $userSettings = $stmt->fetch(PDO::FETCH_ASSOC);        if (!$userSettings) {
            sendResponse(['error' => 'Utilisateur non trouvé'], 404);
        }
        
        $settings = [
            'notification_days' => $userSettings['notification_days'] ?? 3,
            'email_notifications' => $userSettings['email_notifications'] ?? 1,
            'system_notifications_enabled' => $userSettings['system_notifications_enabled'] ?? 1, // Added
            'username' => $userSettings['username'],
            'email' => $userSettings['email'],
            'first_name' => $userSettings['first_name'] ?? '',
            'last_name' => $userSettings['last_name'] ?? ''
        ];

        sendResponse($settings);
    } catch (PDOException $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

// METTRE À JOUR LES PARAMÈTRES UTILISATEUR
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $sessionToken = $data['session_token'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? null;
        
        if (!$sessionToken) {
            sendResponse(['error' => 'Session requise'], 401);
        }
        
        // Enlever "Bearer " si présent
        if (strpos($sessionToken, 'Bearer ') === 0) {
            $sessionToken = substr($sessionToken, 7);
        }
        
        $user = verifySession($sessionToken);
        
        if (!$user) {
            sendResponse(['error' => 'Session invalide'], 401);
        }

        // Approche simplifiée : mise à jour par paramètre individuel
        if (isset($data['notification_days'])) {
            $stmt = $pdo->prepare("UPDATE users SET notification_days = ? WHERE id = ?");
            $stmt->execute([(int)$data['notification_days'], $user['user_id']]);
        }

        if (isset($data['email_notifications'])) {
            $stmt = $pdo->prepare("UPDATE users SET email_notifications = ? WHERE id = ?");
            $stmt->execute([$data['email_notifications'] ? 1 : 0, $user['user_id']]);
        }

        if (isset($data['system_notifications_enabled'])) {
            $stmt = $pdo->prepare("UPDATE users SET system_notifications_enabled = ? WHERE id = ?");
            $stmt->execute([$data['system_notifications_enabled'] ? 1 : 0, $user['user_id']]);
        }

        if (isset($data['first_name'])) {
            $stmt = $pdo->prepare("UPDATE users SET first_name = ? WHERE id = ?");
            $stmt->execute([$data['first_name'], $user['user_id']]);
        }

        if (isset($data['last_name'])) {
            $stmt = $pdo->prepare("UPDATE users SET last_name = ? WHERE id = ?");
            $stmt->execute([$data['last_name'], $user['user_id']]);
        }

        // Récupérer les paramètres mis à jour
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$user['user_id']]);
        $userSettings = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $settings = [
            'notification_days' => $userSettings['notification_days'],
            'email_notifications' => $userSettings['email_notifications'],
            'system_notifications_enabled' => $userSettings['system_notifications_enabled'],
            'username' => $userSettings['username'],
            'email' => $userSettings['email'],
            'first_name' => $userSettings['first_name'] ?? '',
            'last_name' => $userSettings['last_name'] ?? ''
        ];

        sendResponse($settings);
    } catch (PDOException $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}
?>