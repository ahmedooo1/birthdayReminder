<?php
require_once 'config.php';
require_once 'auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
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
        
        // Capturer la sortie du script de rappels
        ob_start();
        include 'cron_send_email_reminders.php';
        $output = ob_get_clean();
        
        // Compter le nombre d'emails envoyés
        preg_match('/(\d+) e-mail\(s\) de rappel envoyé\(s\)/', $output, $matches);
        $emailsSent = isset($matches[1]) ? (int)$matches[1] : 0;
        
        sendResponse([
            'success' => true,
            'message' => "Script de rappels exécuté avec succès",
            'emails_sent' => $emailsSent,
            'output' => $output
        ]);
        
    } catch (Exception $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}
?>
