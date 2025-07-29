<?php
require_once 'config.php';
require_once 'auth.php';
require_once 'utils.php';

// CORS headers are already set in config.php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// RÉCUPÉRER LES ANNIVERSAIRES DE L'UTILISATEUR
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $sessionToken = $_GET['session_token'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? null;
        
        if (!$sessionToken) {
            throw new AuthenticationError('Session requise');
        }
        
        // Enlever "Bearer " si présent
        if (strpos($sessionToken, 'Bearer ') === 0) {
            $sessionToken = substr($sessionToken, 7);
        }
        
        $user = verifySession($sessionToken);
        
        if (!$user) {
            throw new AuthenticationError('Session invalide');
        }

        $groupId = $_GET['group_id'] ?? null;
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $perPage = isset($_GET['per_page']) ? max(1, intval($_GET['per_page'])) : 20;
        $sortBy = $_GET['sort_by'] ?? 'date';
        $sortOrder = $_GET['sort_order'] ?? 'asc';
        $search = $_GET['search'] ?? null;
        $month = isset($_GET['month']) ? intval($_GET['month']) : null;

        if ($groupId) {
            // Vérifier que l'utilisateur est membre du groupe
            $stmt = $pdo->prepare("SELECT * FROM group_members WHERE group_id = ? AND user_id = ?");
            $stmt->execute([$groupId, $user['user_id']]);
            
            if (!$stmt->fetch()) {
                throw new AuthorizationError('Accès non autorisé à ce groupe');
            }
            
            // Récupérer les anniversaires du groupe
            $stmt = $pdo->prepare("
                SELECT b.*, g.name as group_name, g.color as group_color, u.username as created_by_username
                FROM birthdays b 
                LEFT JOIN groupes g ON b.group_id = g.id 
                LEFT JOIN users u ON b.created_by = u.id
                WHERE b.group_id = ?
                ORDER BY " . ($sortBy === 'name' ? 'b.name' : 'b.date') . " " . ($sortOrder === 'desc' ? 'DESC' : 'ASC')
            );
            $stmt->execute([$groupId]);
        } else {
            // Récupérer tous les anniversaires des groupes dont l'utilisateur est membre
            $stmt = $pdo->prepare("
                SELECT b.*, g.name as group_name, g.color as group_color, u.username as created_by_username
                FROM birthdays b 
                LEFT JOIN groupes g ON b.group_id = g.id 
                LEFT JOIN users u ON b.created_by = u.id
                JOIN group_members gm ON b.group_id = gm.group_id
                WHERE gm.user_id = ?
                ORDER BY " . ($sortBy === 'name' ? 'b.name' : 'b.date') . " " . ($sortOrder === 'desc' ? 'DESC' : 'ASC')
            );
            $stmt->execute([$user['user_id']]);
        }

        $birthdays = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Ajouter des informations supplémentaires à chaque anniversaire
        $validBirthdays = [];
        foreach ($birthdays as $birthday) {
            // Skip birthdays with invalid dates
            $daysUntil = daysUntilNextBirthday($birthday['date']);
            if ($daysUntil === -1) {
                error_log("Skipping birthday with invalid date: " . $birthday['name'] . " - " . $birthday['date']);
                continue;
            }
            
            // Calculer l'âge
            $birthday['age'] = calculateAge($birthday['date']);
            
            // Calculer le nombre de jours jusqu'au prochain anniversaire
            $birthday['days_until'] = $daysUntil;
            
            // Obtenir la date du prochain anniversaire
            $birthday['next_birthday'] = getNextBirthdayDate($birthday['date']);
            
            $validBirthdays[] = $birthday;
        }
        $birthdays = $validBirthdays;
        
        // Filtrer par mois si demandé
        if ($month !== null && $month >= 1 && $month <= 12) {
            $birthdays = array_filter($birthdays, function($birthday) use ($month) {
                $birthDate = new DateTime($birthday['date']);
                return intval($birthDate->format('n')) === $month;
            });
            // Réindexer le tableau
            $birthdays = array_values($birthdays);
        }
        
        // Rechercher si demandé
        if ($search) {
            $birthdays = searchArray($birthdays, $search, ['name', 'notes']);
        }
        
        // Paginer les résultats
        $result = paginateArray($birthdays, $page, $perPage);
        
        sendResponse($result);
        
    } catch (Exception $e) {
        handleError($e);
    }
}

// CRÉER UN NOUVEL ANNIVERSAIRE
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $sessionToken = $data['session_token'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? null;
        
        if (!$sessionToken) {
            throw new AuthenticationError('Session requise');
        }
        
        // Enlever "Bearer " si présent
        if (strpos($sessionToken, 'Bearer ') === 0) {
            $sessionToken = substr($sessionToken, 7);
        }
        
        $user = verifySession($sessionToken);
        
        if (!$user) {
            throw new AuthenticationError('Session invalide');
        }

        // Valider les données d'entrée
        $rules = [
            'name' => ['required' => true, 'type' => 'string', 'min_length' => 2, 'max_length' => 100],
            'date' => ['required' => true, 'type' => 'date'],
            'group_id' => ['required' => true, 'type' => 'string'],
            'notes' => ['required' => false, 'type' => 'string']
        ];
        
        $validatedData = validateInput($data, $rules);
        
        // Si un groupe est spécifié, vérifier que l'utilisateur en est membre
        $stmt = $pdo->prepare("SELECT * FROM group_members WHERE group_id = ? AND user_id = ?");
        $stmt->execute([$validatedData['group_id'], $user['user_id']]);
        
        if (!$stmt->fetch()) {
            throw new AuthorizationError('Vous devez être membre du groupe pour y ajouter un anniversaire');
        }

        $id = generateUniqueId('birthday_');
        $name = $validatedData['name'];
        $date = $validatedData['date'];
        $groupId = $validatedData['group_id'];
        $notes = $validatedData['notes'] ?? null;

        $stmt = $pdo->prepare("INSERT INTO birthdays (id, name, date, group_id, notes, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$id, $name, $date, $groupId, $notes, $user['user_id']]);

        // Récupérer l'anniversaire avec les informations du groupe
        $stmt = $pdo->prepare("
            SELECT b.*, g.name as group_name, g.color as group_color, u.username as created_by_username
            FROM birthdays b 
            LEFT JOIN groupes g ON b.group_id = g.id 
            LEFT JOIN users u ON b.created_by = u.id
            WHERE b.id = ?
        ");
        $stmt->execute([$id]);
        $newBirthday = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Ajouter des informations supplémentaires
        $newBirthday['age'] = calculateAge($newBirthday['date']);
        $newBirthday['days_until'] = daysUntilNextBirthday($newBirthday['date']);
        $newBirthday['next_birthday'] = getNextBirthdayDate($newBirthday['date']);

        sendResponse($newBirthday, 201);
    } catch (Exception $e) {
        handleError($e);
    }
}

// METTRE À JOUR UN ANNIVERSAIRE
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? null;
        $sessionToken = $data['session_token'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? null;

        if (!$id) {
            throw new ValidationError('ID de l\'anniversaire requis');
        }

        if (!$sessionToken) {
            throw new AuthenticationError('Session requise');
        }

        // Enlever "Bearer " si présent
        if (strpos($sessionToken, 'Bearer ') === 0) {
            $sessionToken = substr($sessionToken, 7);
        }

        $user = verifySession($sessionToken);

        if (!$user) {
            throw new AuthenticationError('Session invalide');
        }

        // Vérifier que l'anniversaire existe et que l'utilisateur peut le modifier
        $stmt = $pdo->prepare("
            SELECT b.*, gm.user_id as is_member
            FROM birthdays b
            LEFT JOIN group_members gm ON b.group_id = gm.group_id AND gm.user_id = ?
            WHERE b.id = ? AND (b.created_by = ? OR gm.user_id IS NOT NULL)
        ");
        $stmt->execute([$user['user_id'], $id, $user['user_id']]);
        $birthday = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$birthday) {
            throw new NotFoundError('Anniversaire non trouvé ou accès non autorisé');
        }

        // Valider les données d'entrée
        $rules = [
            'name' => ['required' => false, 'type' => 'string', 'min_length' => 2, 'max_length' => 100],
            'date' => ['required' => false, 'type' => 'date'],
            'group_id' => ['required' => false, 'type' => 'string'],
            'notes' => ['required' => false, 'type' => 'string']
        ];
        
        $validatedData = validateInput($data, $rules);

        $fields = [];
        $params = [];

        if (isset($validatedData['name'])) {
            $fields[] = "name = ?";
            $params[] = $validatedData['name'];
        }

        if (isset($validatedData['date'])) {
            $fields[] = "date = ?";
            $params[] = $validatedData['date'];
        }

        if (isset($validatedData['group_id'])) {
            // Vérifier que l'utilisateur est membre du nouveau groupe
            $stmt = $pdo->prepare("SELECT * FROM group_members WHERE group_id = ? AND user_id = ?");
            $stmt->execute([$validatedData['group_id'], $user['user_id']]);
            
            if (!$stmt->fetch()) {
                throw new AuthorizationError('Vous devez être membre du groupe de destination');
            }
            
            $fields[] = "group_id = ?";
            $params[] = $validatedData['group_id'];
        }

        if (isset($validatedData['notes'])) {
            $fields[] = "notes = ?";
            $params[] = $validatedData['notes'];
        }

        if (empty($fields)) {
            throw new ValidationError('Aucune donnée à mettre à jour');
        }

        $params[] = $id;
        $sql = "UPDATE birthdays SET " . implode(", ", $fields) . " WHERE id = ?";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        // Récupérer l'anniversaire mis à jour avec les informations du groupe
        $stmt = $pdo->prepare("
            SELECT b.*, g.name as group_name, g.color as group_color, u.username as created_by_username
            FROM birthdays b 
            LEFT JOIN groupes g ON b.group_id = g.id 
            LEFT JOIN users u ON b.created_by = u.id
            WHERE b.id = ?
        ");
        $stmt->execute([$id]);
        $updatedBirthday = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Ajouter des informations supplémentaires
        $updatedBirthday['age'] = calculateAge($updatedBirthday['date']);
        $updatedBirthday['days_until'] = daysUntilNextBirthday($updatedBirthday['date']);
        $updatedBirthday['next_birthday'] = getNextBirthdayDate($updatedBirthday['date']);

        sendResponse($updatedBirthday);
    } catch (Exception $e) {
        handleError($e);
    }
}

// SUPPRIMER UN ANNIVERSAIRE
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        $id = $_GET['id'] ?? null;
        $sessionToken = $_GET['session_token'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? null;

        if (!$id) {
            throw new ValidationError('ID de l\'anniversaire requis');
        }

        if (!$sessionToken) {
            throw new AuthenticationError('Session requise');
        }

        // Enlever "Bearer " si présent
        if (strpos($sessionToken, 'Bearer ') === 0) {
            $sessionToken = substr($sessionToken, 7);
        }

        $user = verifySession($sessionToken);

        if (!$user) {
            throw new AuthenticationError('Session invalide');
        }

        // Vérifier que l'anniversaire existe et que l'utilisateur peut le supprimer
        $stmt = $pdo->prepare("
            SELECT b.*, gm.user_id as is_member
            FROM birthdays b
            LEFT JOIN group_members gm ON b.group_id = gm.group_id AND gm.user_id = ?
            WHERE b.id = ? AND (b.created_by = ? OR gm.user_id IS NOT NULL)
        ");
        $stmt->execute([$user['user_id'], $id, $user['user_id']]);
        $birthday = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$birthday) {
            throw new NotFoundError('Anniversaire non trouvé ou accès non autorisé');
        }

        $stmt = $pdo->prepare("DELETE FROM birthdays WHERE id = ?");
        $stmt->execute([$id]);

        sendResponse(['success' => true, 'message' => 'Anniversaire supprimé avec succès']);
    } catch (Exception $e) {
        handleError($e);
    }
}
?>