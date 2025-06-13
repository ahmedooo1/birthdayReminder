<?php
require_once 'config.php';
require_once 'auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// HANDLER FOR GETTING USERS OF A SPECIFIC GROUP (action=get_users)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_users') {
    try {
        $sessionToken = $_GET['session_token'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? null;
        $groupId = $_GET['group_id'] ?? null;

        if (!$sessionToken) {
            sendResponse(['error' => 'Session requise'], 401);
        }
        if (!$groupId) {
            sendResponse(['error' => 'ID de groupe requis'], 400);
        }

        if (strpos($sessionToken, 'Bearer ') === 0) {
            $sessionToken = substr($sessionToken, 7);
        }

        $user = verifySession($sessionToken);
        if (!$user) {
            sendResponse(['error' => 'Session invalide'], 401);
        }

        // Verify current user is a member of the requested group
        $stmt = $pdo->prepare("SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?");
        $stmt->execute([$groupId, $user['user_id']]);
        if (!$stmt->fetch()) {
            sendResponse(['error' => 'Accès non autorisé à ce groupe'], 403);
        }

        // Fetch members of the group
        $stmt = $pdo->prepare("
            SELECT u.id, u.username, u.email 
            FROM users u
            JOIN group_members gm ON u.id = gm.user_id
            WHERE gm.group_id = ?
        ");
        $stmt->execute([$groupId]);
        $users_list = $stmt->fetchAll(PDO::FETCH_ASSOC);

        sendResponse(['data' => $users_list]);

    } catch (PDOException $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
    exit; // Important: exit after handling this specific action
}

// RÉCUPÉRER LES GROUPES DE L'UTILISATEUR (General GET)
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
        
        // Récupérer tous les groupes auxquels l'utilisateur appartient
        $stmt = $pdo->prepare("
            SELECT g.*, u.username as owner_name,
                   CASE WHEN g.owner_id = ? THEN 1 ELSE 0 END as is_owner
            FROM groupes g 
            JOIN group_members gm ON g.id = gm.group_id 
            JOIN users u ON g.owner_id = u.id
            WHERE gm.user_id = ?
            ORDER BY g.created_at DESC
        ");
        $stmt->execute([$user['user_id'], $user['user_id']]);
        
        $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Ajouter le nombre de membres pour chaque groupe
        foreach ($groups as &$group_item) { // Renamed $group to $group_item to avoid conflict if this file is included elsewhere
            $stmt_count = $pdo->prepare("SELECT COUNT(*) as member_count FROM group_members WHERE group_id = ?");
            $stmt_count->execute([$group_item['id']]);
            $group_item['member_count'] = $stmt_count->fetchColumn();
        }
        unset($group_item); // Unset reference
        
        sendResponse($groups);
        
    } catch (PDOException $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

// CRÉER UN NOUVEAU GROUPE OU REJOINDRE UN GROUPE
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
        
        // Check if this is a join request
        if (isset($data['action']) && $data['action'] === 'join') {
            if (!isset($data['access_code'])) {
                sendResponse(['error' => 'Code d\'accès requis'], 400);
            }            
            $accessCode = strtoupper(trim($data['access_code']));
            $stmt = $pdo->prepare("SELECT * FROM groupes WHERE access_code = ?");
            $stmt->execute([$accessCode]);
            $group = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$group) {
                sendResponse(['error' => 'Code d\'accès invalide'], 404);
            }
            
            // Vérifier si l'utilisateur est déjà membre
            $stmt = $pdo->prepare("SELECT * FROM group_members WHERE group_id = ? AND user_id = ?");
            $stmt->execute([$group['id'], $user['user_id']]);
            
            if ($stmt->fetch()) {
                sendResponse(['error' => 'Vous êtes déjà membre de ce groupe'], 400);
            }
              // Ajouter l'utilisateur au groupe
            global $dbType;
            $currentTime = $dbType === 'sqlite' ? "datetime('now')" : "NOW()";
            $membershipId = uniqid(); // Générer un ID unique pour l'adhésion
            $stmt = $pdo->prepare("INSERT INTO group_members (id, group_id, user_id, joined_at) VALUES (?, ?, ?, $currentTime)");
            $stmt->execute([$membershipId, $group['id'], $user['user_id']]);
            
            sendResponse(['success' => true, 'message' => 'Vous avez rejoint le groupe avec succès', 'group' => $group]);
            return;
        }

        // Créer un nouveau groupe
        if (!isset($data['name'])) {
            sendResponse(['error' => 'Le nom du groupe est requis'], 400);
        }

        $id = uniqid();
        $name = $data['name'];
        $description = $data['description'] ?? null;
        $color = $data['color'] ?? '#4361ee';
        $accessCode = $data['access_code'] ?? strtoupper(substr(md5(uniqid()), 0, 6));

        // Créer le groupe
        $stmt = $pdo->prepare("INSERT INTO groupes (id, name, description, color, access_code, owner_id, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$id, $name, $description, $color, $accessCode, $user['user_id']]);

        // Ajouter le propriétaire comme membre du groupe
        $membershipId = uniqid(); // Generate a unique ID for the membership
        $stmt = $pdo->prepare("INSERT INTO group_members (id, group_id, user_id, joined_at) VALUES (?, ?, ?, NOW())");
        $stmt->execute([$membershipId, $id, $user['user_id']]);

        $newGroup = [
            'id' => $id,
            'name' => $name,
            'description' => $description,
            'color' => $color,
            'access_code' => $accessCode,
            'owner_id' => $user['user_id'],
            'owner_name' => $user['username'],
            'is_owner' => 1,
            'member_count' => 1
        ];

        sendResponse($newGroup, 201);
    } catch (PDOException $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

// METTRE À JOUR UN GROUPE
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? null;
        $sessionToken = $data['session_token'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? null;

        if (!$id) {
            sendResponse(['error' => 'ID du groupe requis'], 400);
        }

        if (!$sessionToken) {
            sendResponse(['error' => 'Session requise'], 401);
        }

        // Enlever "Bearer " si présent
        if (strpos($sessionToken, 'Bearer ') === 0) {
            $sessionToken = substr($sessionToken, 7);
        }        $user = verifySession($sessionToken);

        if (!$user) {
            sendResponse(['error' => 'Session invalide'], 401);
        }

        // Vérifier que l'utilisateur est le propriétaire du groupe
        $stmt = $pdo->prepare("SELECT * FROM groupes WHERE id = ? AND owner_id = ?");
        $stmt->execute([$id, $user['user_id']]);
        $group = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$group) {
            sendResponse(['error' => 'Groupe non trouvé ou accès non autorisé'], 403);
        }

        // Action pour quitter un groupe
        if (isset($data['action']) && $data['action'] === 'leave') {
            // Un propriétaire ne peut pas quitter son propre groupe
            if ($group['owner_id'] == $user['user_id']) {
                sendResponse(['error' => 'Le propriétaire ne peut pas quitter son propre groupe'], 400);
            }

            $stmt = $pdo->prepare("DELETE FROM group_members WHERE group_id = ? AND user_id = ?");
            $stmt->execute([$id, $user['user_id']]);

            sendResponse(['success' => true, 'message' => 'Vous avez quitté le groupe']);
            return;
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
        }        if (empty($fields)) {
            sendResponse(['error' => 'Aucune donnée à mettre à jour'], 400);
        }

        $params[] = $id;
        $sql = "UPDATE groupes SET " . implode(", ", $fields) . " WHERE id = ?";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);// Récupérer le groupe mis à jour
        $stmt = $pdo->prepare("
            SELECT g.*, u.username as owner_name,
                   CASE WHEN g.owner_id = ? THEN 1 ELSE 0 END as is_owner
            FROM groupes g 
            JOIN users u ON g.owner_id = u.id
            WHERE g.id = ?
        ");
        $stmt->execute([$user['user_id'], $id]);
        $updatedGroup = $stmt->fetch(PDO::FETCH_ASSOC);

        // Ajouter le nombre de membres
        $stmt = $pdo->prepare("SELECT COUNT(*) as member_count FROM group_members WHERE group_id = ?");
        $stmt->execute([$id]);
        $updatedGroup['member_count'] = $stmt->fetchColumn();

        sendResponse($updatedGroup);
    } catch (PDOException $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

// SUPPRIMER UN GROUPE
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        $id = $_GET['id'] ?? null;
        $sessionToken = $_GET['session_token'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? null;

        if (!$id) {
            sendResponse(['error' => 'ID du groupe requis'], 400);
        }

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
        }        // Vérifier que l'utilisateur est le propriétaire du groupe
        $stmt = $pdo->prepare("SELECT * FROM groupes WHERE id = ? AND owner_id = ?");
        $stmt->execute([$id, $user['user_id']]);
        $group = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$group) {
            sendResponse(['error' => 'Groupe non trouvé ou accès non autorisé'], 403);
        }

        // Commencer une transaction
        $pdo->beginTransaction();

        try {
            // Supprimer tous les membres du groupe
            $stmt = $pdo->prepare("DELETE FROM group_members WHERE group_id = ?");
            $stmt->execute([$id]);

            // Mettre à jour les anniversaires associés à ce groupe (les rendre sans groupe)
            $stmt = $pdo->prepare("UPDATE birthdays SET group_id = NULL WHERE group_id = ?");
            $stmt->execute([$id]);            // Supprimer le groupe
            $stmt = $pdo->prepare("DELETE FROM groupes WHERE id = ?");
            $stmt->execute([$id]);

            $pdo->commit();
            sendResponse(['success' => true, 'message' => 'Groupe supprimé avec succès']);

        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }

    } catch (PDOException $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}
?>