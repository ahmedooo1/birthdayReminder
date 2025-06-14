<?php
require_once 'config.php';

// En-têtes CORS pour l'environnement de production
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Gérer les requêtes preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Récupérer toutes les notifications
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Get the Authorization header
        $authHeader = null;
        if (isset($_SERVER['Authorization'])) {
            $authHeader = $_SERVER['Authorization'];
        } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) { // Nginx or fast CGI
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
            if (isset($requestHeaders['Authorization'])) {
                $authHeader = $requestHeaders['Authorization'];
            }
        }

        if (!$authHeader) {
            sendResponse(['error' => 'Authorization header missing'], 401);
            exit;
        }

        list($type, $token) = explode(" ", $authHeader, 2);
        if (strcasecmp($type, "Bearer") != 0 || !$token) {
            sendResponse(['error' => 'Invalid token type or token missing'], 401);
            exit;
        }

        // Validate token and get user_id
        $stmt_user = $pdo->prepare("SELECT user_id FROM user_sessions WHERE session_token = ? AND expires_at > NOW()");
        $stmt_user->execute([$token]);
        $session = $stmt_user->fetch();

        if (!$session) {
            sendResponse(['error' => 'Invalid or expired session token'], 401);
            exit;
        }
        $userId = $session['user_id'];

        $stmt = $pdo->prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$userId]);
        $notifications = $stmt->fetchAll();

        // Format dates and boolean for the response
        foreach ($notifications as &$notification) {
            if (isset($notification['created_at'])) {
                try {
                    $dt = new DateTime($notification['created_at']); // DB format is 'Y-m-d H:i:s'
                    $notification['createdAt'] = $dt->format(DateTime::ATOM); // Format as ISO 8601
                    unset($notification['created_at']); // Remove original to avoid confusion
                } catch (Exception $e) {
                    $notification['createdAt'] = null; // Or some error indicator
                }
            }
            // Ensure is_read is a boolean
            $notification['is_read'] = isset($notification['is_read']) ? (bool)$notification['is_read'] : false;
        }
        unset($notification); // Break the reference

        sendResponse($notifications);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    } catch (Exception $e) {
        sendResponse(['error' => 'General error: ' . $e->getMessage()], 500);
    }
}

// Créer une nouvelle notification
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get the Authorization header (duplication, consider refactoring to a function)
        $authHeader = null;
        if (isset($_SERVER['Authorization'])) {
            $authHeader = $_SERVER['Authorization'];
        } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
            if (isset($requestHeaders['Authorization'])) {
                $authHeader = $requestHeaders['Authorization'];
            }
        }

        if (!$authHeader) {
            sendResponse(['error' => 'Authorization header missing'], 401);
            exit;
        }

        list($type, $token) = explode(" ", $authHeader, 2);
        if (strcasecmp($type, "Bearer") != 0 || !$token) {
            sendResponse(['error' => 'Invalid token type or token missing'], 401);
            exit;
        }

        $stmt_user = $pdo->prepare("SELECT user_id FROM user_sessions WHERE session_token = ? AND expires_at > NOW()");
        $stmt_user->execute([$token]);
        $session = $stmt_user->fetch();

        if (!$session) {
            sendResponse(['error' => 'Invalid or expired session token'], 401);
            exit;
        }
        $userId = $session['user_id'];

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['title']) || !isset($data['message'])) {
            sendResponse(['error' => 'Le titre et le message sont requis'], 400);
            exit; // Added exit
        }

        $id = uniqid();
        $title = $data['title'];
        $message = $data['message'];
        $birthdayId = $data['birthdayId'] ?? null;

        // Ensure date is in YYYY-MM-DD HH:MM:SS format for MySQL
        $dateInput = $data['date'] ?? date('Y-m-d H:i:s'); // Default to now if not provided
        $dbDate = '';
        try {
            $dateTime = new DateTime($dateInput); // Handles ISO 8601 and other common formats
            $dbDate = $dateTime->format('Y-m-d H:i:s'); // Format for DB
        } catch (Exception $e) {
            // If parsing fails, default to current server time in DB format
            $dbDate = date('Y-m-d H:i:s');
        }

        $stmt = $pdo->prepare("INSERT INTO notifications (id, user_id, title, message, birthday_id, created_at, is_read) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $userId, $title, $message, $birthdayId, $dbDate, 0]); // is_read defaults to 0 (false)

        // For the response, format createdAt to YYYY-MM-DD
        $createdAtDateTime = new DateTime($dbDate);

        $newNotification = [
            'id' => $id,
            'user_id' => $userId,
            'title' => $title,
            'message' => $message,
            'birthdayId' => $birthdayId,
            'is_read' => false, // Correct field name and boolean type
            'createdAt' => $createdAtDateTime->format(DateTime::ATOM) // Format as ISO 8601
        ];

        sendResponse($newNotification, 201);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    } catch (Exception $e) {
        sendResponse(['error' => 'Date processing error: ' . $e->getMessage()], 500);
    }
}

// Marquer une notification comme lue
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        // Authentication (should be present for all state-changing actions)
        $authHeader = null;
        if (isset($_SERVER['Authorization'])) {
            $authHeader = $_SERVER['Authorization'];
        } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
            if (isset($requestHeaders['Authorization'])) {
                $authHeader = $requestHeaders['Authorization'];
            }
        }

        if (!$authHeader) {
            sendResponse(['error' => 'Authorization header missing'], 401);
            exit;
        }
        list($type, $token) = explode(" ", $authHeader, 2);
        if (strcasecmp($type, "Bearer") != 0 || !$token) {
            sendResponse(['error' => 'Invalid token type or token missing'], 401);
            exit;
        }
        $stmt_user = $pdo->prepare("SELECT user_id FROM user_sessions WHERE session_token = ? AND expires_at > NOW()");
        $stmt_user->execute([$token]);
        $session = $stmt_user->fetch();
        if (!$session) {
            sendResponse(['error' => 'Invalid or expired session token'], 401);
            exit;
        }
        $userId = $session['user_id'];

        $id = $_GET['id'] ?? null;

        if (!$id) {
            sendResponse(['error' => 'ID de la notification requis'], 400);
            exit; // Added exit
        }

        // Ensure user can only mark their own notifications
        $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);

        if ($stmt->rowCount() === 0) {
            // Could be not found, or not belonging to the user
            sendResponse(['error' => 'Notification non trouvée ou non autorisée'], 404);
            exit; // Added exit
        }

        sendResponse(['success' => true]);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    } catch (Exception $e) {
        sendResponse(['error' => 'General error: ' . $e->getMessage()], 500);
    }
}

// Marquer toutes les notifications comme lues
if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    try {
        // Authentication
        $authHeader = null;
        if (isset($_SERVER['Authorization'])) {
            $authHeader = $_SERVER['Authorization'];
        } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
            if (isset($requestHeaders['Authorization'])) {
                $authHeader = $requestHeaders['Authorization'];
            }
        }
        if (!$authHeader) { sendResponse(['error' => 'Authorization header missing'], 401); exit; }
        list($type, $token) = explode(" ", $authHeader, 2);
        if (strcasecmp($type, "Bearer") != 0 || !$token) { sendResponse(['error' => 'Invalid token type or token missing'], 401); exit; }
        
        $stmt_user = $pdo->prepare("SELECT user_id FROM user_sessions WHERE session_token = ? AND expires_at > NOW()");
        $stmt_user->execute([$token]);
        $session = $stmt_user->fetch();
        if (!$session) { sendResponse(['error' => 'Invalid or expired session token'], 401); exit; }
        $userId = $session['user_id'];

        $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0");
        $stmt->execute([$userId]);

        sendResponse(['success' => true, 'count' => $stmt->rowCount()]);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    } catch (Exception $e) {
        sendResponse(['error' => 'General error: ' . $e->getMessage()], 500);
    }
}

// Supprimer toutes les notifications (Attention: This is a destructive action)
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    try {
        // Authentication
        $authHeader = null;
        if (isset($_SERVER['Authorization'])) {
            $authHeader = $_SERVER['Authorization'];
        } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
            if (isset($requestHeaders['Authorization'])) {
                $authHeader = $requestHeaders['Authorization'];
            }
        }
        if (!$authHeader) { sendResponse(['error' => 'Authorization header missing'], 401); exit; }
        list($type, $token) = explode(" ", $authHeader, 2);
        if (strcasecmp($type, "Bearer") != 0 || !$token) { sendResponse(['error' => 'Invalid token type or token missing'], 401); exit; }

        $stmt_user = $pdo->prepare("SELECT user_id FROM user_sessions WHERE session_token = ? AND expires_at > NOW()");
        $stmt_user->execute([$token]);
        $session = $stmt_user->fetch();
        if (!$session) { sendResponse(['error' => 'Invalid or expired session token'], 401); exit; }
        $userId = $session['user_id'];

        // This will delete ALL notifications for the authenticated user.
        // If you intend to delete a specific notification, you\'d need an ID.
        $stmt = $pdo->prepare("DELETE FROM notifications WHERE user_id = ?");
        $stmt->execute([$userId]);

        sendResponse(['success' => true, 'deleted_count' => $stmt->rowCount()]);
    } catch (PDOException $e) {
        sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    } catch (Exception $e) {
        sendResponse(['error' => 'General error: ' . $e->getMessage()], 500);
    }
}
?>