<?php
require_once 'config.php';

// En-têtes CORS pour l'environnement de production
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

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
function createUser($username, $email, $password) {
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
        
        // Insérer le nouvel utilisateur
        global $dbType;
        $currentTime = $dbType === 'sqlite' ? "datetime('now')" : "NOW()";
        $stmt = $pdo->prepare("
            INSERT INTO users (id, username, email, password_hash, created_at)
            VALUES (?, ?, ?, ?, $currentTime)
        ");
        $stmt->execute([$userId, $username, $email, $passwordHash]);
        
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
            
            $user = createUser($data['username'], $data['email'], $data['password']);
            
            if (!$user) {
                sendResponse(['error' => 'Nom d\'utilisateur ou email déjà utilisé'], 409);
            }
            
            $session = createSession($user['id']);
            
            if (!$session) {
                sendResponse(['error' => 'Erreur lors de la création de la session'], 500);
            }
            
            sendResponse($session);
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
            
            if (isset($data['notification_days'])) {
                $fields[] = "notification_days = ?";
                $params[] = intval($data['notification_days']);
            }
            
            if (empty($fields)) {
                sendResponse(['error' => 'Aucune donnée à mettre à jour'], 400);
            }
            
            $params[] = $user['user_id'];
            $sql = "UPDATE users SET " . implode(", ", $fields) . " WHERE id = ?";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            sendResponse(['success' => true, 'message' => 'Profil mis à jour avec succès']);
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
            

            
        case 'forgot_password':
            // Demande de réinitialisation de mot de passe
            $data = json_decode(file_get_contents('php://input'), true);
            $email = $data['email'] ?? '';
            
            if (empty($email)) {
                sendResponse(['error' => 'Email requis'], 400);
            }
            
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                sendResponse(['error' => 'Email invalide'], 400);
            }
            
            try {
                // Vérifier si l'utilisateur existe
                $stmt = $pdo->prepare("SELECT id, first_name, last_name FROM users WHERE email = ?");
                $stmt->execute([$email]);
                $user = $stmt->fetch();
                
                if (!$user) {
                    // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
                    sendResponse([
                        'success' => true, 
                        'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.'
                    ]);
                    break;
                }
                
                // Générer un token sécurisé
                $resetToken = bin2hex(random_bytes(32));
                $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour')); // Token valide 1 heure
                
                // Enregistrer le token en base
                $stmt = $pdo->prepare("UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?");
                $stmt->execute([$resetToken, $expiresAt, $user['id']]);
                
                // Envoyer l'email de réinitialisation
                $resetUrl = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . 
                           '://' . $_SERVER['HTTP_HOST'] . 
                           '/front/index.html?reset_token=' . $resetToken;
                
                $userName = trim($user['first_name'] . ' ' . $user['last_name']);
                if (empty($userName)) {
                    $userName = 'Utilisateur';
                }
                
                $subject = 'Réinitialisation de votre mot de passe - Birthday Reminder';
                $message = '
                <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <h2 style="color: #4361ee; margin-bottom: 20px;">Réinitialisation de mot de passe</h2>
                        <p>Bonjour ' . htmlspecialchars($userName) . ',</p>
                        <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Birthday Reminder.</p>
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
                            Birthday Reminder - Système de gestion d\'anniversaires<br>
                            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
                        </p>
                    </div>
                </body>
                </html>';
                
                require_once 'utils.php';
                $emailSent = sendEmail($email, $subject, $message);
                
                if ($emailSent) {
                    sendResponse([
                        'success' => true, 
                        'message' => 'Un email de réinitialisation a été envoyé à votre adresse.'
                    ]);
                } else {
                    sendResponse(['error' => 'Erreur lors de l\'envoi de l\'email'], 500);
                }
                
            } catch (PDOException $e) {
                error_log("Erreur forgot_password: " . $e->getMessage());
                sendResponse(['error' => 'Erreur serveur'], 500);
            }
            break;
            
        case 'reset_password':
            // Réinitialisation effective du mot de passe
            $data = json_decode(file_get_contents('php://input'), true);
            $token = $data['token'] ?? '';
            $newPassword = $data['new_password'] ?? '';
            $confirmPassword = $data['confirm_password'] ?? '';
            
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
                    SELECT id, email, first_name, last_name, reset_token_expires 
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
                
                // Envoyer un email de confirmation
                $userName = trim($user['first_name'] . ' ' . $user['last_name']);
                if (empty($userName)) {
                    $userName = 'Utilisateur';
                }
                
                $subject = 'Mot de passe modifié avec succès - Birthday Reminder';
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
                            Birthday Reminder - Système de gestion d\'anniversaires<br>
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
            
        default:
            sendResponse(['error' => 'Action non reconnue'], 400);
    }
}

