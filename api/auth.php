<?php
require_once 'config.php';

// Les en-têtes CORS sont déjà définis dans config.php, ne pas les redéfinir ici
// pour éviter les doublons qui causent des problèmes CORS

// Gérer les requêtes preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * Fonctions d'authentification et de gestion des sessions
 */

// Durée de validité d'une session en secondes (24 heures par défaut)
define('SESSION_LIFETIME', env('SESSION_LIFETIME', 86400));

/**
 * Vérifier si une session est valide
 * 
 * @param string $sessionToken Jeton de session
 * @return array|false Données de l'utilisateur si la session est valide, false sinon
 */
function verifySession($sessionToken) {
    global $pdo;
    
    if (!$sessionToken) {
        error_log("DEBUG: Session token is empty");
        return false;
    }
    
    try {
        global $dbType;
        $currentTime = $dbType === 'sqlite' ? "datetime('now')" : "NOW()";
        error_log("DEBUG: Verifying session token: " . substr($sessionToken, 0, 10) . "...");
        error_log("DEBUG: Current time query: " . $currentTime);
        
        // Vérifier si la session existe et n'est pas expirée
        $stmt = $pdo->prepare("
            SELECT us.*, u.id as user_id, u.username, u.email, u.first_name, u.last_name, 
                   u.email_notifications, u.notification_days
            FROM user_sessions us
            JOIN users u ON us.user_id = u.id
            WHERE us.session_token = ? AND us.expires_at > $currentTime
        ");
        $stmt->execute([$sessionToken]);
        $session = $stmt->fetch();
        
        error_log("DEBUG: Session query result: " . ($session ? "Found" : "Not found"));
        
        if (!$session) {
            // Vérifier si le token existe même expiré
            $stmt2 = $pdo->prepare("SELECT expires_at FROM user_sessions WHERE session_token = ?");
            $stmt2->execute([$sessionToken]);
            $expiredSession = $stmt2->fetch();
            if ($expiredSession) {
                error_log("DEBUG: Session exists but expired. Expires at: " . $expiredSession['expires_at']);
            } else {
                error_log("DEBUG: Session token not found in database");
            }
            return false;
        }
        
        // Prolonger la session si elle est valide
        extendSession($sessionToken);
        
        return $session;
    } catch (PDOException $e) {
        error_log("Erreur lors de la vérification de la session: " . $e->getMessage());
        return false;
    }
}

/**
 * Prolonger la durée de vie d'une session
 * 
 * @param string $sessionToken Jeton de session
 * @return bool Succès de l'opération
 */
function extendSession($sessionToken) {
    global $pdo;
    
    try {
        $expiresAt = date('Y-m-d H:i:s', time() + SESSION_LIFETIME);
        
        $stmt = $pdo->prepare("
            UPDATE user_sessions 
            SET expires_at = ? 
            WHERE session_token = ?
        ");
        $stmt->execute([$expiresAt, $sessionToken]);
        
        return true;
    } catch (PDOException $e) {
        error_log("Erreur lors de la prolongation de la session: " . $e->getMessage());
        return false;
    }
}

/**
 * Créer une nouvelle session pour un utilisateur
 * 
 * @param string $userId ID de l'utilisateur
 * @return array|false Données de la session si créée avec succès, false sinon
 */
function createSession($userId) {
    global $pdo, $dbType;
    
    try {
        // Générer un jeton de session unique
        $sessionToken = bin2hex(random_bytes(32));
        $sessionId = uniqid();
        $expiresAt = date('Y-m-d H:i:s', time() + SESSION_LIFETIME);
        
        // Insérer la nouvelle session
        $currentTime = $dbType === 'sqlite' ? "datetime('now')" : "NOW()";
        $stmt = $pdo->prepare("
            INSERT INTO user_sessions (id, user_id, session_token, expires_at, created_at)
            VALUES (?, ?, ?, ?, $currentTime)
        ");
        $stmt->execute([$sessionId, $userId, $sessionToken, $expiresAt]);
        
        // Récupérer les informations de l'utilisateur
        $stmt = $pdo->prepare("
            SELECT id, username, email, first_name, last_name, email_notifications, notification_days
            FROM users
            WHERE id = ?
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if (!$user) {
            return false;
        }
        
        // Mettre à jour la date de dernière connexion
        $currentTime = $dbType === 'sqlite' ? "datetime('now')" : "NOW()";
        $stmt = $pdo->prepare("
            UPDATE users
            SET last_login = $currentTime
            WHERE id = ?
        ");
        $stmt->execute([$userId]);
        
        return [
            'session_token' => $sessionToken,
            'user' => $user
        ];
    } catch (PDOException $e) {
        error_log("Erreur lors de la création de la session: " . $e->getMessage());
        return false;
    }
}

/**
 * Détruire une session
 * 
 * @param string $sessionToken Jeton de session
 * @return bool Succès de l'opération
 */
function destroySession($sessionToken) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            DELETE FROM user_sessions
            WHERE session_token = ?
        ");
        $stmt->execute([$sessionToken]);
        
        return true;
    } catch (PDOException $e) {
        error_log("Erreur lors de la destruction de la session: " . $e->getMessage());
        return false;
    }
}

/**
 * Vérifier les identifiants d'un utilisateur
 * 
 * @param string $username Nom d'utilisateur ou email
 * @param string $password Mot de passe
 * @return array|false Données de l'utilisateur si les identifiants sont valides, false sinon
 */
function verifyCredentials($username, $password) {
    global $pdo;
    
    try {
        // Vérifier si l'utilisateur existe
        $stmt = $pdo->prepare("
            SELECT id, username, email, password_hash
            FROM users
            WHERE username = ? OR email = ?
        ");
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch();
        
        if (!$user) {
            return false;
        }
        
        // Vérifier le mot de passe
        if (!password_verify($password, $user['password_hash'])) {
            // Ajouter un délai pour prévenir les attaques par force brute
            sleep(1);
            return false;
        }
        
        // Si le hachage doit être mis à jour (nouvel algorithme, nouveau coût, etc.)
        if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("
                UPDATE users
                SET password_hash = ?
                WHERE id = ?
            ");
            $stmt->execute([$newHash, $user['id']]);
        }
        
        return $user;
    } catch (PDOException $e) {
        error_log("Erreur lors de la vérification des identifiants: " . $e->getMessage());
        return false;
    }
}

/**
 * Créer un nouvel utilisateur
 * 
 * @param string $username Nom d'utilisateur
 * @param string $email Email
 * @param string $password Mot de passe
 * @return array|false Données de l'utilisateur si créé avec succès, false sinon
 */
function createUser($username, $email, $password, $emailVerificationToken = null) {
    global $pdo;
    
    try {
        // Vérifier si le nom d'utilisateur ou l'email existe déjà
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count
            FROM users
            WHERE username = ? OR email = ?
        ");
        $stmt->execute([$username, $email]);
        $result = $stmt->fetch();
        
        if ($result['count'] > 0) {
            return false;
        }
        
        // Hacher le mot de passe
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $userId = uniqid();
        
        // Insérer le nouvel utilisateur avec email_verified = 0 et email_verification_token
        global $dbType;
        $currentTime = $dbType === 'sqlite' ? "datetime('now')" : "NOW()";
        $stmt = $pdo->prepare("
            INSERT INTO users (id, username, email, password_hash, email_verified, email_verification_token, created_at)
            VALUES (?, ?, ?, ?, 0, ?, $currentTime)
        ");
        $stmt->execute([$userId, $username, $email, $passwordHash, $emailVerificationToken]);
        
        // Récupérer les informations de l'utilisateur
        $stmt = $pdo->prepare("
            SELECT id, username, email, first_name, last_name, email_notifications, notification_days
            FROM users
            WHERE id = ?
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        return $user;
    } catch (PDOException $e) {
        error_log("Erreur lors de la création de l'utilisateur: " . $e->getMessage());
        return false;
    }
}

/**
 * Générer un jeton CSRF
 * 
 * @return string Jeton CSRF
 */
function generateCsrfToken() {
    if (!isset($_SESSION)) {
        session_start();
    }
    
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    
    return $_SESSION['csrf_token'];
}

/**
 * Vérifier un jeton CSRF
 * 
 * @param string $token Jeton CSRF à vérifier
 * @return bool Validité du jeton
 */
function verifyCsrfToken($token) {
    if (!isset($_SESSION)) {
        session_start();
    }
    
    if (!isset($_SESSION['csrf_token'])) {
        return false;
    }
    
    return hash_equals($_SESSION['csrf_token'], $token);
}

// Traitement des requêtes d'authentification
if (basename($_SERVER['PHP_SELF']) === 'auth.php') {
    // Activer la session PHP pour le CSRF
    if (!isset($_SESSION)) {
        session_start();
    }
    
    // Récupérer l'action demandée
    $action = $_GET['action'] ?? '';
    
    // Traiter les différentes actions
    switch ($action) {
        case 'login':
            // Connexion
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['username']) || !isset($data['password'])) {
                sendResponse(['error' => 'Nom d\'utilisateur et mot de passe requis'], 400);
            }
            
            $user = verifyCredentials($data['username'], $data['password']);
            
            if (!$user) {
                // Ajouter un délai pour prévenir les attaques par force brute
                sleep(1);
                sendResponse(['error' => 'Identifiants invalides'], 401);
            }
            
            // Vérifier si l'email est vérifié
            if (isset($user['email_verified']) && !$user['email_verified']) {
                sendResponse(['error' => 'Email non vérifié. Veuillez vérifier votre adresse email.'], 403);
            }
            
            $session = createSession($user['id']);
            
            if (!$session) {
                sendResponse(['error' => 'Erreur lors de la création de la session'], 500);
            }
            
            sendResponse($session);
            break;
            
        case 'register':
            // Inscription
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
                sendResponse(['error' => 'Tous les champs sont requis'], 400);
            }
            
            // Valider les données
            if (strlen($data['username']) < 3) {
                sendResponse(['error' => 'Le nom d\'utilisateur doit contenir au moins 3 caractères'], 400);
            }
            
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                sendResponse(['error' => 'Adresse email invalide'], 400);
            }
            
            if (strlen($data['password']) < 6) {
                sendResponse(['error' => 'Le mot de passe doit contenir au moins 6 caractères'], 400);
            }
            
            global $pdo, $dbType;

            // Vérifier si un utilisateur existe avec le même nom d'utilisateur ou email
            $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
            $stmt->execute([$data['username'], $data['email']]);
            $existingUser = $stmt->fetch();

            $emailVerificationToken = bin2hex(random_bytes(32));
            $user = null;

            if ($existingUser) {
                // Un utilisateur existe déjà
                if ($existingUser['email_verified']) {
                    // L'utilisateur est vérifié, c'est un conflit
                    if (strcasecmp($existingUser['username'], $data['username']) == 0) {
                        sendResponse(['error' => 'Ce nom d\'utilisateur est déjà utilisé.'], 409);
                    }
                    if (strcasecmp($existingUser['email'], $data['email']) == 0) {
                        sendResponse(['error' => 'Cette adresse email est déjà utilisée.'], 409);
                    }
                    // Erreur générique si les deux champs sont différents mais correspondent à des utilisateurs différents
                    sendResponse(['error' => 'Nom d\'utilisateur ou email déjà utilisé'], 409);
                } else {
                    // L'utilisateur existe mais n'est pas vérifié.
                    // On met à jour ses informations et on renvoie un email de vérification.
                    // Cela permet à un utilisateur de retenter une inscription s'il a échoué la première fois.
                    
                    // On vérifie que le nom d'utilisateur n'est pas pris par un AUTRE compte non vérifié
                    if (strcasecmp($existingUser['email'], $data['email']) != 0) {
                        sendResponse(['error' => 'Ce nom d\'utilisateur est déjà utilisé.'], 409);
                    }

                    $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
                    $currentTime = $dbType === 'sqlite' ? "datetime('now')" : "NOW()";
                    
                    $stmt = $pdo->prepare("
                        UPDATE users 
                        SET password_hash = ?, email_verification_token = ?, created_at = $currentTime, username = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([$passwordHash, $emailVerificationToken, $data['username'], $existingUser['id']]);
                    
                    $user = [
                        'id' => $existingUser['id'],
                        'username' => $data['username'],
                        'email' => $data['email']
                    ];
                }
            } else {
                // Aucun utilisateur n'existe, on en crée un nouveau
                $user = createUser($data['username'], $data['email'], $data['password'], $emailVerificationToken);
            }

            if (!$user) {
                sendResponse(['error' => 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.'], 500);
            }
            
            // Envoyer l'email de vérification
            $appBaseUrl = env('APP_BASE_URL');
            if (empty($appBaseUrl)) {
                $scheme = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http';
                $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
                $appBaseUrl = $scheme . '://' . $host;
            }
            $verificationUrl = rtrim($appBaseUrl, '/') . '/index.html?verify_email_token=' . $emailVerificationToken;
            
            $subject = 'Vérification de votre adresse email - RappelAnniv';
            $message = '
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #4361ee; margin-bottom: 20px;">Vérification de l\'email</h2>
                    <p>Bonjour ' . htmlspecialchars($user['username']) . ',</p>
                    <p>Merci de vous être inscrit sur RappelAnniv. Veuillez vérifier votre adresse email en cliquant sur le lien ci-dessous :</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="' . $verificationUrl . '" 
                           style="background-color: #4361ee; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Vérifier mon email
                        </a>
                    </div>
                    <p>Si vous n\'êtes pas à l\'origine de cette inscription, vous pouvez ignorer cet email.</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e9ecef;">
                    <p style="font-size: 12px; color: #6c757d;">
                        RappelAnniv - Système de gestion d\'anniversaires<br>
                        Cet email a été envoyé automatiquement, merci de ne pas y répondre.
                    </p>
                </div>
            </body>
            </html>';
            
            require_once 'utils.php';
            sendEmail($user['email'], $subject, $message);
            
            sendResponse(['success' => true, 'message' => 'Un email de vérification a été envoyé. Veuillez vérifier votre boîte de réception.']);
            break;
            
        case 'logout':
            // Déconnexion
            $data = json_decode(file_get_contents('php://input'), true);
            $sessionToken = $data['session_token'] ?? null;
            
            if (!$sessionToken) {
                sendResponse(['error' => 'Jeton de session requis'], 400);
            }
            
            destroySession($sessionToken);
            sendResponse(['success' => true]);
            break;
            
        case 'verify':
            // Vérification de session
            $data = json_decode(file_get_contents('php://input'), true);
            $sessionToken = $data['session_token'] ?? null;
            
            if (!$sessionToken) {
                sendResponse(['error' => 'Jeton de session requis'], 400);
            }
            
            $user = verifySession($sessionToken);
            
            if (!$user) {
                sendResponse(['error' => 'Session invalide ou expirée'], 401);
            }
            
            sendResponse(['success' => true, 'user' => $user]);
            break;
            
        case 'csrf':
            // Génération d'un jeton CSRF
            $token = generateCsrfToken();
            sendResponse(['csrf_token' => $token]);
            break;
            
        case 'profile':
            // Obtenir le profil utilisateur
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
            
            // Obtenir les paramètres utilisateur complets
            $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$user['user_id']]);
            $userProfile = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Enlever le hash du mot de passe
            unset($userProfile['password_hash']);
            
            sendResponse($userProfile);
            break;
            
        case 'update_profile':
            // Mettre à jour le profil utilisateur
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
            
            // TODO: Implement CSRF token verification
            // Vérifier le jeton CSRF
            // if (!isset($data['csrf_token']) || !verifyCsrfToken($data['csrf_token'])) {
            //     sendResponse(['error' => 'Jeton CSRF invalide'], 403);
            // }
            
            $fields = [];
            $params = [];
            
            if (isset($data['first_name'])) {
                $fields[] = "first_name = ?";
                $params[] = $data['first_name'];
            }
            
            if (isset($data['last_name'])) {
                $fields[] = "last_name = ?";
                $params[] = $data['last_name'];
            }
            
            if (isset($data['username'])) {
                // Vérifier que le nom d'utilisateur n'est pas déjà utilisé par un autre utilisateur
                $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE username = ? AND id != ?");
                $stmt->execute([$data['username'], $user['user_id']]);
                $result = $stmt->fetch();
                
                if ($result['count'] > 0) {
                    sendResponse(['error' => 'Ce nom d\'utilisateur est déjà utilisé par un autre utilisateur'], 409);
                }
                
                $fields[] = "username = ?";
                $params[] = $data['username'];
            }
            
            if (isset($data['email'])) {
                // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
                $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE email = ? AND id != ?");
                $stmt->execute([$data['email'], $user['user_id']]);
                $result = $stmt->fetch();
                
                if ($result['count'] > 0) {
                    sendResponse(['error' => 'Cet email est déjà utilisé par un autre utilisateur'], 409);
                }
                
                $fields[] = "email = ?";
                $params[] = $data['email'];
            }
            
            if (isset($data['email_notifications'])) {
                $fields[] = "email_notifications = ?";
                $params[] = $data['email_notifications'] ? 1 : 0;
            }
            
            // if (isset($data['notification_days'])) { // Old check
            //     $fields[] = "notification_days = ?";
            //     $params[] = intval($data['notification_days']);
            // }

            // New handling for notification_days to allow NULL
            if (array_key_exists('notification_days', $data)) {
                $fields[] = "notification_days = ?";
                // Assumes $data['notification_days'] is either null or a validated integer from frontend
                $params[] = $data['notification_days']; 
            }

            // Phone number (optional, normalized)
            if (array_key_exists('phone_number', $data)) {
                $rawPhone = trim((string)$data['phone_number']);
                $normalized = preg_replace('/[^+0-9]/', '', $rawPhone);
                $fields[] = "phone_number = ?";
                $params[] = $normalized;
            }

            // SMS notifications opt-in
            if (isset($data['sms_notifications'])) {
                $fields[] = "sms_notifications = ?";
                $params[] = $data['sms_notifications'] ? 1 : 0;
            }
            
            // Telegram fields
            if (isset($data['telegram_bot_token'])) {
                $fields[] = "telegram_bot_token = ?";
                $params[] = $data['telegram_bot_token'];
            }
            
            if (isset($data['telegram_chat_id'])) {
                $fields[] = "telegram_chat_id = ?";
                $params[] = $data['telegram_chat_id'];
            }
            
            if (isset($data['telegram_notifications'])) {
                $fields[] = "telegram_notifications = ?";
                $params[] = $data['telegram_notifications'] ? 1 : 0;
            }
            
            if (empty($fields)) {
                sendResponse(['error' => 'Aucune donnée à mettre à jour'], 400);
            }
            
            $params[] = $user['user_id'];
            $sql = "UPDATE users SET " . implode(", ", $fields) . " WHERE id = ?";
            
            // Log SQL and params
            error_log("[AuthUpdateProfile] Attempting to update profile for user_id: " . $user['user_id']);
            error_log("[AuthUpdateProfile] SQL: " . $sql);
            error_log("[AuthUpdateProfile] Params: " . json_encode($params));

            $stmt = $pdo->prepare($sql);
            $success = $stmt->execute($params);
            $rowCount = $stmt->rowCount();
            error_log("[AuthUpdateProfile] Execution success: " . ($success ? 'true' : 'false') . ", Rows affected: " . $rowCount);
            
            if ($success) {
                // Fetch the updated user data directly to return
                $stmt_check = $pdo->prepare("SELECT * FROM users WHERE id = ?");
                $stmt_check->execute([$user['user_id']]);
                $updatedUserProfile = $stmt_check->fetch(PDO::FETCH_ASSOC);
                unset($updatedUserProfile['password_hash']); // Remove sensitive data
                error_log("[AuthUpdateProfile] Data fetched after update: " . json_encode($updatedUserProfile));
                sendResponse(['success' => true, 'message' => 'Profil mis à jour avec succès', 'updated_user_data' => $updatedUserProfile]);
            } else {
                error_log("[AuthUpdateProfile] Update failed.");
                sendResponse(['error' => 'Erreur lors de la mise à jour du profil en base de données.'], 500);
            }
            break;
            
        case 'change_password':
            // Changer le mot de passe
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
            
            // TODO: Implement CSRF token verification
            // Vérifier le jeton CSRF
            // if (!isset($data['csrf_token']) || !verifyCsrfToken($data['csrf_token'])) {
            //     sendResponse(['error' => 'Jeton CSRF invalide'], 403);
            // }
            
            if (!isset($data['current_password']) || !isset($data['new_password'])) {
                sendResponse(['error' => 'Mot de passe actuel et nouveau mot de passe requis'], 400);
            }
            
            // Vérifier le mot de passe actuel
            $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
            $stmt->execute([$user['user_id']]);
            $result = $stmt->fetch();
            
            if (!password_verify($data['current_password'], $result['password_hash'])) {
                sendResponse(['error' => 'Mot de passe actuel incorrect'], 401);
            }
            
            // Valider le nouveau mot de passe
            if (strlen($data['new_password']) < 6) {
                sendResponse(['error' => 'Le nouveau mot de passe doit contenir au moins 6 caractères'], 400);
            }
            
            // Mettre à jour le mot de passe
            $newPasswordHash = password_hash($data['new_password'], PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
            $stmt->execute([$newPasswordHash, $user['user_id']]);
            
            sendResponse(['success' => true, 'message' => 'Mot de passe mis à jour avec succès']);
            break;
            

            
        case 'forgotpassword':
            // Demande de réinitialisation de mot de passe
            $debug = isset($_GET['debug']) && $_GET['debug'] == '1';
            $email = $_POST['email'] ?? '';
            $rawInput = '';
            if (empty($email)) {
                $rawInput = file_get_contents('php://input');
                $data = json_decode($rawInput, true);
                if (isset($data['email'])) {
                    $email = $data['email'];
                }
            }
            $debugInfo = [
                'raw_post' => $_POST,
                'raw_input' => $rawInput,
                'method' => $_SERVER['REQUEST_METHOD'],
                'email' => $email
            ];
            if (empty($email)) {
                if ($debug) sendResponse(['error' => 'Email requis', 'debug' => $debugInfo], 400);
                sendResponse(['error' => 'Email requis'], 400);
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                if ($debug) sendResponse(['error' => 'Email invalide', 'debug' => $debugInfo], 400);
                sendResponse(['error' => 'Email invalide'], 400);
            }
            try {
                $stmt = $pdo->prepare("SELECT id, first_name, last_name, username FROM users WHERE email = ?");
                $stmt->execute([$email]);
                $user = $stmt->fetch();
                $debugInfo['user_found'] = $user ? true : false;
                if (!$user) {
                    if ($debug) sendResponse(['success' => true, 'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.', 'debug' => $debugInfo]);
                    sendResponse(['success' => true, 'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.']);
                    break;
                }
                $resetToken = bin2hex(random_bytes(32));
                $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
                $stmt = $pdo->prepare("UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?");
                $stmt->execute([$resetToken, $expiresAt, $user['id']]);
                
                // Utiliser APP_BASE_URL de .env pour construire l'URL de réinitialisation, avec fallback
                $appBaseUrl = env('APP_BASE_URL');
                if (empty($appBaseUrl)) {
                    // Fallback si APP_BASE_URL n'est pas défini
                    $scheme = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http';
                    $host = $_SERVER['HTTP_HOST'] ?? 'localhost'; // Utiliser 'localhost' ou un domaine par défaut si HTTP_HOST n'est pas défini
                    $appBaseUrl = $scheme . '://' . $host;
                }
                $resetUrl = rtrim($appBaseUrl, '/') . '/index.html?reset_token=' . $resetToken;
                
                // Debug : vérifier les valeurs des noms
                $debugInfo['user_data'] = [
                    'id' => $user['id'],
                    'first_name' => $user['first_name'] ?? 'NULL',
                    'last_name' => $user['last_name'] ?? 'NULL',
                    'username' => $user['username'] ?? 'NULL'
                ];
                
                // Construire le nom utilisateur avec priorité aux vrais noms, puis username en fallback
                $firstName = trim($user['first_name'] ?? '');
                $lastName = trim($user['last_name'] ?? '');
                $userName = trim($firstName . ' ' . $lastName);
                
                if (empty($userName)) {
                    $userName = $user['username'] ?? 'Utilisateur';
                }
                $subject = 'Réinitialisation de votre mot de passe - RappelAnniv';
                $message = '
                <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <h2 style="color: #4361ee; margin-bottom: 20px;">Réinitialisation de mot de passe</h2>
                        <p>Bonjour ' . htmlspecialchars($userName) . ',</p>
                        <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte RappelAnniv.</p>
                        <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="' . $resetUrl . '" 
                               style="background-color: #4361ee; color: white; padding: 12px 30px; 
                                      text-decoration: none; border-radius: 5px; display: inline-block;">
                                Réinitialiser mon mot de passe
                            </a>
                        </div>
                        <p><strong>Important :</strong> Ce lien expirera dans 1 heure pour des raisons de sécurité.</p>
                        <p>Si vous n\'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
                        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e9ecef;">
                        <p style="font-size: 12px; color: #6c757d;">
                            RappelAnniv - Système de gestion d\'anniversaires<br>
                            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
                        </p>
                    </div>
                </body>
                </html>';

                require_once 'utils.php';
                // Debug: récupérer la config email
                if ($debug) {
                    $debugInfo['mail_config'] = [
                        'MAIL_HOST' => env('MAIL_HOST', ''),
                        'MAIL_PORT' => env('MAIL_PORT', ''),
                        'MAIL_USERNAME' => env('MAIL_USERNAME', ''),
                        'MAIL_FROM_ADDRESS' => env('MAIL_FROM_ADDRESS', ''),
                        'MAIL_FROM_NAME' => env('MAIL_FROM_NAME', ''),
                        'MAIL_ENCRYPTION' => env('MAIL_ENCRYPTION', '')
                    ];
                }
                $emailSent = sendEmail($email, $subject, $message);
                $debugInfo['reset_url'] = $resetUrl;
                $debugInfo['email_sent'] = $emailSent;
                if ($emailSent) {
                    if ($debug) sendResponse(['success' => true, 'message' => 'Un email de réinitialisation a été envoyé à votre adresse.', 'debug' => $debugInfo]);
                    sendResponse(['success' => true, 'message' => 'Un email de réinitialisation a été envoyé à votre adresse.']);
                } else {
                    if ($debug) sendResponse(['error' => 'Erreur lors de l\'envoi de l\'email', 'debug' => $debugInfo], 500);
                    sendResponse(['error' => 'Erreur lors de l\'envoi de l\'email'], 500);
                }
            } catch (PDOException $e) {
                if ($debug) sendResponse(['error' => 'Erreur serveur', 'debug' => $debugInfo, 'exception' => $e->getMessage()], 500);
                error_log("Erreur forgot_password: " . $e->getMessage());
                sendResponse(['error' => 'Erreur serveur'], 500);
            }
            break;
            
        case 'reset_password':
            // Réinitialisation effective du mot de passe
            $token = $_POST['token'] ?? '';
            $newPassword = $_POST['new_password'] ?? '';
            $confirmPassword = $_POST['confirm_password'] ?? '';
            
            if (empty($token) || empty($newPassword) || empty($confirmPassword)) {
                sendResponse(['error' => 'Tous les champs sont requis'], 400);
            }
            
            if ($newPassword !== $confirmPassword) {
                sendResponse(['error' => 'Les mots de passe ne correspondent pas'], 400);
            }
            
            if (strlen($newPassword) < 6) {
                sendResponse(['error' => 'Le mot de passe doit contenir au moins 6 caractères'], 400);
            }
            
            try {
                // Vérifier le token - utiliser PHP timestamp pour éviter les problèmes de timezone
                $stmt = $pdo->prepare("
                    SELECT id, email, first_name, last_name, username, reset_token_expires 
                    FROM users 
                    WHERE reset_token = ?
                ");
                $stmt->execute([$token]);
                $user = $stmt->fetch();
                
                if (!$user) {
                    sendResponse(['error' => 'Token invalide ou expiré'], 400);
                }
                
                // Vérifier l'expiration avec PHP
                $expiresTimestamp = strtotime($user['reset_token_expires']);
                $currentTimestamp = time();
                
                if ($expiresTimestamp <= $currentTimestamp) {
                    sendResponse(['error' => 'Token invalide ou expiré'], 400);
                }
                
                // Hasher le nouveau mot de passe
                $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
                
                // Mettre à jour le mot de passe et supprimer le token
                $stmt = $pdo->prepare("
                    UPDATE users 
                    SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL 
                    WHERE id = ?
                ");
                $stmt->execute([$passwordHash, $user['id']]);
                
                // Construire le nom utilisateur avec priorité aux vrais noms, puis username en fallback
                $firstName = trim($user['first_name'] ?? '');
                $lastName = trim($user['last_name'] ?? '');
                $userName = trim($firstName . ' ' . $lastName);
                
                if (empty($userName)) {
                    $userName = $user['username'] ?? 'Utilisateur';
                }
                
                $subject = 'Mot de passe modifié avec succès - RappelAnniv';
                $message = '
                <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <h2 style="color: #28a745; margin-bottom: 20px;">Mot de passe modifié</h2>
                        <p>Bonjour ' . htmlspecialchars($userName) . ',</p>
                        <p>Votre mot de passe a été modifié avec succès.</p>
                        <p>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
                        <p>Si vous n\'êtes pas à l\'origine de cette modification, contactez-nous immédiatement.</p>
                        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e9ecef;">
                        <p style="font-size: 12px; color: #6c757d;">
                            RappelAnniv - Système de gestion d\'anniversaires<br>
                            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
                        </p>
                    </div>
                </body>
                </html>';
                
                require_once 'utils.php';
                sendEmail($user['email'], $subject, $message);
                
                sendResponse([
                    'success' => true, 
                    'message' => 'Mot de passe modifié avec succès. Vous pouvez maintenant vous connecter.'
                ]);
                
            } catch (PDOException $e) {
                error_log("Erreur reset_password: " . $e->getMessage());
                sendResponse(['error' => 'Erreur serveur'], 500);
            }
            break;
            
        case 'verify_email':
            // Vérification de l'email via token
            $data = json_decode(file_get_contents('php://input'), true);
            $token = $data['token'] ?? null;
            
            if (!$token) {
                sendResponse(['error' => 'Token de vérification requis'], 400);
            }
            
            try {
                $stmt = $pdo->prepare("SELECT id FROM users WHERE email_verification_token = ?");
                $stmt->execute([$token]);
                $user = $stmt->fetch();
                
                if (!$user) {
                    sendResponse(['error' => 'Token invalide ou expiré'], 400);
                }
                
                // Mettre à jour l'utilisateur pour marquer l'email comme vérifié et supprimer le token
                $stmt = $pdo->prepare("UPDATE users SET email_verified = 1, email_verification_token = NULL WHERE id = ?");
                $stmt->execute([$user['id']]);
                
                sendResponse(['success' => true, 'message' => 'Email vérifié avec succès']);
            } catch (PDOException $e) {
                error_log("Erreur verify_email: " . $e->getMessage());
                sendResponse(['error' => 'Erreur serveur'], 500);
            }
            break;
        case 'test_telegram':
            // Envoi d'un message de test Telegram pour l'utilisateur courant
            $sessionToken = $_GET['session_token'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? null;

            if (!$sessionToken) {
                sendResponse(['success' => false, 'message' => 'Session requise'], 401);
            }

            // Enlever "Bearer " si présent
            if (strpos($sessionToken, 'Bearer ') === 0) {
                $sessionToken = substr($sessionToken, 7);
            }

            $user = verifySession($sessionToken);
            if (!$user) {
                sendResponse(['success' => false, 'message' => 'Session invalide'], 401);
            }

            try {
                // Récupérer les champs Telegram stockés pour cet utilisateur
                $stmt = $pdo->prepare("SELECT username, telegram_bot_token, telegram_chat_id, telegram_notifications FROM users WHERE id = ?");
                $stmt->execute([$user['user_id']]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$row) {
                    sendResponse(['success' => false, 'message' => 'Utilisateur introuvable'], 404);
                }

                $enabled = (int)($row['telegram_notifications'] ?? 0) === 1;
                $botToken = trim((string)($row['telegram_bot_token'] ?? ''));
                $chatId = trim((string)($row['telegram_chat_id'] ?? ''));

                if (!$enabled) {
                    sendResponse(['success' => false, 'message' => 'Les notifications Telegram ne sont pas activées dans votre profil.']);
                }
                if (empty($botToken) || empty($chatId)) {
                    sendResponse(['success' => false, 'message' => 'Token du bot ou Chat ID manquant. Veuillez compléter vos réglages Telegram.']);
                }

                require_once __DIR__ . '/utils.php';
                $username = $row['username'] ?? 'Utilisateur';
                $text = "Test Telegram RappelAnniv pour @{$username} : OK ✅";
                $ok = sendTelegramMessage($botToken, $chatId, $text);

                if ($ok) {
                    sendResponse(['success' => true, 'message' => 'Message Telegram envoyé. Vérifiez votre application.']);
                } else {
                    sendResponse(['success' => false, 'message' => "Échec de l'envoi Telegram. Vérifiez le token, le chat ID et que vous avez bien démarré une conversation avec votre bot."]);
                }
            } catch (PDOException $e) {
                error_log('test_telegram error: ' . $e->getMessage());
                sendResponse(['success' => false, 'message' => 'Erreur serveur.'], 500);
            }
            break;
        default:
            sendResponse(['error' => 'Action non reconnue'], 400);
    }
}

