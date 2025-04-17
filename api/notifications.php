<?php
require_once 'config.php';

// Récupérer toutes les notifications
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
try {
$stmt = $pdo->prepare("SELECT * FROM notifications ORDER BY created_at DESC");
$stmt->execute();
$notifications = $stmt->fetchAll();
sendResponse($notifications);
} catch (PDOException $e) {
sendResponse(['error' => $e->getMessage()], 500);
}
}

// Créer une nouvelle notification
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
try {
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['title']) || !isset($data['message'])) {
sendResponse(['error' => 'Le titre et le message sont requis'], 400);
}

$id = uniqid();
$title = $data['title'];
$message = $data['message'];
$birthdayId = $data['birthdayId'] ?? null;
$date = $data['date'] ?? date('Y-m-d H:i:s');

$stmt = $pdo->prepare("INSERT INTO notifications (id, title, message, birthday_id, date) VALUES (?, ?, ?, ?, ?)");
$stmt->execute([$id, $title, $message, $birthdayId, $date]);

$newNotification = [
'id' => $id,
'title' => $title,
'message' => $message,
'birthdayId' => $birthdayId,
'date' => $date,
'read' => false,
'createdAt' => date('Y-m-d H:i:s')
];

sendResponse($newNotification, 201);
} catch (PDOException $e) {
sendResponse(['error' => $e->getMessage()], 500);
}
}

// Marquer une notification comme lue
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
try {
$id = $_GET['id'] ?? null;

if (!$id) {
sendResponse(['error' => 'ID de la notification requis'], 400);
}

$stmt = $pdo->prepare("UPDATE notifications SET read = TRUE WHERE id = ?");
$stmt->execute([$id]);

if ($stmt->rowCount() === 0) {
sendResponse(['error' => 'Notification non trouvée'], 404);
}

sendResponse(['success' => true]);
} catch (PDOException $e) {
sendResponse(['error' => $e->getMessage()], 500);
}
}

// Marquer toutes les notifications comme lues
if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
try {
$stmt = $pdo->prepare("UPDATE notifications SET read = TRUE WHERE read = FALSE");
$stmt->execute();

sendResponse(['success' => true, 'count' => $stmt->rowCount()]);
} catch (PDOException $e) {
sendResponse(['error' => $e->getMessage()], 500);
}
}

// Supprimer toutes les notifications
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
try {
$stmt = $pdo->prepare("DELETE FROM notifications");
$stmt->execute();

sendResponse(['success' => true]);
} catch (PDOException $e) {
sendResponse(['error' => $e->getMessage()], 500);
}
}