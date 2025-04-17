<?php
require_once 'config.php';

// Récupérer tous les groupes
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
try {
$stmt = $pdo->prepare("SELECT * FROM groups");
$stmt->execute();
$groups = $stmt->fetchAll();
sendResponse($groups);
} catch (PDOException $e) {
sendResponse(['error' => $e->getMessage()], 500);
}
}

// Créer un nouveau groupe
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
try {
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['name'])) {
sendResponse(['error' => 'Le nom du groupe est requis'], 400);
}

$id = uniqid();
$name = $data['name'];
$description = $data['description'] ?? null;
$color = $data['color'] ?? '#4361ee';

$stmt = $pdo->prepare("INSERT INTO groups (id, name, description, color) VALUES (?, ?, ?, ?)");
$stmt->execute([$id, $name, $description, $color]);

$newGroup = [
'id' => $id,
'name' => $name,
'description' => $description,
'color' => $color
];

sendResponse($newGroup, 201);
} catch (PDOException $e) {
sendResponse(['error' => $e->getMessage()], 500);
}
}

// Mettre à jour un groupe
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
try {
$data = json_decode(file_get_contents('php://input'), true);
$id = $_GET['id'] ?? null;

if (!$id) {
sendResponse(['error' => 'ID du groupe requis'], 400);
}

$fields = [];
$params = [];

if (isset($data['name'])) {
$fields[] = "name = ?";
$params[] = $data['name'];
}

if (isset($data['description'])) {
$fields[] = "description = ?";
$params[] = $data['description'];
}

if (isset($data['color'])) {
$fields[] = "color = ?";
$params[] = $data['color'];
}

if (empty($fields)) {
sendResponse(['error' => 'Aucune donnée à mettre à jour'], 400);
}

$params[] = $id;
$sql = "UPDATE groups SET " . implode(", ", $fields) . " WHERE id = ?";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

if ($stmt->rowCount() === 0) {
sendResponse(['error' => 'Groupe non trouvé'], 404);
}

$stmt = $pdo->prepare("SELECT * FROM groups WHERE id = ?");
$stmt->execute([$id]);
$updatedGroup = $stmt->fetch();

sendResponse($updatedGroup);
} catch (PDOException $e) {
sendResponse(['error' => $e->getMessage()], 500);
}
}

// Supprimer un groupe
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
try {
$id = $_GET['id'] ?? null;

if (!$id) {
sendResponse(['error' => 'ID du groupe requis'], 400);
}

// Mettre à jour les anniversaires associés à ce groupe
$stmt = $pdo->prepare("UPDATE birthdays SET group_id = NULL WHERE group_id = ?");
$stmt->execute([$id]);

// Supprimer le groupe
$stmt = $pdo->prepare("DELETE FROM groups WHERE id = ?");
$stmt->execute([$id]);

if ($stmt->rowCount() === 0) {
sendResponse(['error' => 'Groupe non trouvé'], 404);
}

sendResponse(['success' => true]);
} catch (PDOException $e) {
sendResponse(['error' => $e->getMessage()], 500);
}
}