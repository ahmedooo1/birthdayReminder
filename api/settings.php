<?php
require_once 'config.php';

// Récupérer les paramètres
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
try {
$stmt = $pdo->prepare("SELECT * FROM settings WHERE id = 1");
$stmt->execute();
$settings = $stmt->fetch();

if (!$settings) {
// Créer les paramètres par défaut s'ils n'existent pas
$stmt = $pdo->prepare("INSERT INTO settings (id, notification_days, enable_notifications) VALUES (1, 3, TRUE)");
$stmt->execute();

$settings = [
'id' => 1,
'notification_days' => 3,
'enable_notifications' => true
];
}

sendResponse($settings);
} catch (PDOException $e) {
sendResponse(['error' => $e->getMessage()], 500);
}
}

// Mettre à jour les paramètres
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
try {
$data = json_decode(file_get_contents('php://input'), true);

$fields = [];
$params = [];

if (isset($data['notificationDays'])) {
$fields[] = "notification_days = ?";
$params[] = $data['notificationDays'];
}

if (isset($data['enableNotifications'])) {
$fields[] = "enable_notifications = ?";
$params[] = $data['enableNotifications'] ? 1 : 0;
}

if (empty($fields)) {
sendResponse(['error' => 'Aucune donnée à mettre à jour'], 400);
}

$sql = "UPDATE settings SET " . implode(", ", $fields) . " WHERE id = 1";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

$stmt = $pdo->prepare("SELECT * FROM settings WHERE id = 1");
$stmt->execute();
$updatedSettings = $stmt->fetch();

sendResponse($updatedSettings);
} catch (PDOException $e) {
sendResponse(['error' => $e->getMessage()], 500);
}
}