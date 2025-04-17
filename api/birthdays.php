<?php
require_once 'config.php';

// Récupérer tous les anniversaires
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
try {
$groupId = $_GET['group_id'] ?? null;

if ($groupId) {
$stmt = $pdo->prepare("SELECT * FROM birthdays WHERE group_id = ?");
$stmt->execute([$groupId]);
} else {
$stmt = $pdo->prepare("SELECT * FROM birthdays");
$stmt->execute();
}

$birthdays = $stmt->fetchAll();
sendResponse($birthdays);
} catch (PDOException $e) {
sendResponse(['error' => $e->getMessage()], 500);
}
}

// Créer un nouvel anniversaire
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
try {
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['name']) || !isset($data['date'])) {
sendResponse(['error' => 'Le nom et la date sont requis'], 400);
}

$id = uniqid();
$name = $data['name'];
$date = $data['date'];
$groupId = $data['groupId'] ?? null;
$notes = $data['notes'] ?? null;

$stmt = $pdo->prepare("INSERT INTO birthdays (id, name, date, group_id, notes) VALUES (?, ?, ?, ?, ?)");
$stmt->execute([$id, $name, $date, $groupId, $notes]);

$newBirthday = [
'id' => $id,
'name' => $name,
'date' => $date,
'groupId' => $groupId,
'notes' => $notes
];

sendResponse($newBirthday, 201);
} catch (PDOException $e) {
sendResponse(['error' => $e->getMessage()], 500);
}
}

// Mettre à jour un anniversaire
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
try {
$data = json_decode(file_get_contents('php://input'), true);
$id = $_GET['id'] ?? null;

if (!$id) {
sendResponse(['error' => 'ID de l\'anniversaire requis'], 400);
}

$fields = [];
$params = [];

if (isset($data['name'])) {
$fields[] = "name = ?";
$params[] = $data['name'];
}

if (isset($data['date'])) {
$fields[] = "date = ?";
$params[] = $data['date'];
}

if (array_key_exists('groupId', $data)) {
$fields[] = "group_id = ?";
$params[] = $data['groupId'];
}

if (array_key_exists('notes', $data)) {
$fields[] = "notes = ?";
$params[] = $data['notes'];
}

if (empty($fields)) {
sendResponse(['error' => 'Aucune donnée à mettre à jour'], 400);
}

$params[] = $id;
$sql = "UPDATE birthdays SET " . implode(", ", $fields) . " WHERE id = ?";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

if ($stmt->rowCount() === 0) {
sendResponse(['error' => 'Anniversaire non trouvé'], 404);
}

$stmt = $pdo->prepare("SELECT * FROM birthdays WHERE id = ?");
$stmt->execute([$id]);
$updatedBirthday = $stmt->fetch();

sendResponse($updatedBirthday);
} catch (PDOException $e) {
sendResponse(['error' => $e->getMessage()], 500);
}
}

// Supprimer un anniversaire
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
try {
$id = $_GET['id'] ?? null;

if (!$id) {
sendResponse(['error' => 'ID de l\'anniversaire requis'], 400);
}

$stmt = $pdo->prepare("DELETE FROM birthdays WHERE id = ?");
$stmt->execute([$id]);

if ($stmt->rowCount() === 0) {
sendResponse(['error' => 'Anniversaire non trouvé'], 404);
}

sendResponse(['success' => true]);
} catch (PDOException $e) {
sendResponse(['error' => $e->getMessage()], 500);
}
}