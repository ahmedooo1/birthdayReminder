<?php
/**
 * Fichier d'utilitaires pour l'API
 * 
 * Ce fichier contient des fonctions utilitaires communes à plusieurs fichiers
 */

// Charger PHPMailer
require_once __DIR__ . '/../vendor/autoload.php';

// Charger les fonctions d'environnement
require_once __DIR__ . '/env.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

/**
 * Générer un identifiant unique
 * 
 * @param string $prefix Préfixe de l'identifiant
 * @return string Identifiant unique
 */
function generateUniqueId($prefix = '') {
    return $prefix . uniqid();
}

/**
 * Formater une date pour l'affichage
 * 
 * @param string $date Date au format YYYY-MM-DD
 * @param string $format Format de sortie
 * @return string Date formatée
 */
function formatDate($date, $format = 'd/m/Y') {
    try {
        $dateObj = new DateTime($date);
        return $dateObj->format($format);
    } catch (Exception $e) {
        error_log("Invalid date format: " . $date . " - " . $e->getMessage());
        return 'Date invalide';
    }
}

/**
 * Calculer l'âge à partir d'une date de naissance
 * 
 * @param string $birthdate Date de naissance au format YYYY-MM-DD
 * @return int Âge en années
 */
function calculateAge($birthdate) {
    try {
        $birth = new DateTime($birthdate);
        $now = new DateTime();
        $interval = $now->diff($birth);
        return $interval->y;
    } catch (Exception $e) {
        error_log("Invalid birthdate format: " . $birthdate . " - " . $e->getMessage());
        return 0; // Return 0 as fallback age
    }
}

/**
 * Calculer le nombre de jours jusqu'au prochain anniversaire
 * 
 * @param string $birthdate Date de naissance au format YYYY-MM-DD
 * @return int Nombre de jours
 */
function daysUntilNextBirthday($birthdate) {
    try {
        $birth = new DateTime($birthdate);
        $now = new DateTime();
        
        // Créer une date pour l'anniversaire cette année
        $nextBirthday = new DateTime();
        $nextBirthday->setDate($now->format('Y'), $birth->format('m'), $birth->format('d'));
        
        // Si l'anniversaire est déjà passé cette année, passer à l'année prochaine
        if ($nextBirthday < $now) {
            $nextBirthday->modify('+1 year');
        }
        
        // Calculer la différence en jours
        $diff = $now->diff($nextBirthday);
        return $diff->days;
    } catch (Exception $e) {
        error_log("Invalid birthdate format: " . $birthdate . " - " . $e->getMessage());
        return -1; // Return -1 to indicate invalid date
    }
}

/**
 * Obtenir la date du prochain anniversaire
 * 
 * @param string $birthdate Date de naissance au format YYYY-MM-DD
 * @return string Date du prochain anniversaire au format YYYY-MM-DD
 */
function getNextBirthdayDate($birthdate) {
    try {
        $birth = new DateTime($birthdate);
        $now = new DateTime();
        
        // Créer une date pour l'anniversaire cette année
        $nextBirthday = new DateTime();
        $nextBirthday->setDate($now->format('Y'), $birth->format('m'), $birth->format('d'));
        
        // Si l'anniversaire est déjà passé cette année, passer à l'année prochaine
        if ($nextBirthday < $now) {
            $nextBirthday->modify('+1 year');
        }
        
        return $nextBirthday->format('Y-m-d');
    } catch (Exception $e) {
        error_log("Invalid birthdate format: " . $birthdate . " - " . $e->getMessage());
        return date('Y-m-d'); // Return today's date as fallback
    }
}

/**
 * Générer un code d'accès aléatoire
 * 
 * @param int $length Longueur du code
 * @return string Code d'accès
 */
function generateAccessCode($length = 6) {
    $characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclusion des caractères ambigus
    $code = '';
    
    for ($i = 0; $i < $length; $i++) {
        $code .= $characters[rand(0, strlen($characters) - 1)];
    }
    
    return $code;
}

/**
 * Envoyer un email
 * 
 * @param string $to Adresse email du destinataire
 * @param string $subject Sujet de l'email
 * @param string $message Corps de l'email
 * @param array $headers En-têtes supplémentaires
 * @return bool Succès de l'envoi
 */
function sendEmail($to, $subject, $message, $headers = []) {
    error_log("sendEmail called. To: " . $to . ", Subject: " . $subject);

    // Récupérer les paramètres d'email depuis la configuration
    $emailHost = env('MAIL_HOST', 'smtp.gmail.com');
    $emailPort = env('MAIL_PORT', 587);
    $emailUsername = env('MAIL_USERNAME', '');
    $emailPassword = env('MAIL_PASSWORD', '');
    $emailFromName = env('MAIL_FROM_NAME', 'Birthday Reminder');
    $emailFromAddress = env('MAIL_FROM_ADDRESS', '');
    $emailEncryption = env('MAIL_ENCRYPTION', 'tls');

    error_log("Mail Config: Host=" . $emailHost . ", Port=" . $emailPort . ", Username=" . $emailUsername . ", FromAddress=" . $emailFromAddress . ", Encryption=" . $emailEncryption . ", Password set: " . (empty($emailPassword) ? 'No' : 'Yes'));

    // Si les paramètres d'email ne sont pas configurés, journaliser et retourner false
    if (empty($emailUsername) || empty($emailPassword) || empty($emailFromAddress)) {
        error_log('Configuration email incomplète. Email non envoyé. Username empty: ' . empty($emailUsername) . ', Password empty: ' . empty($emailPassword) . ', FromAddress empty: ' . empty($emailFromAddress));
        return false;
    }
    
    try {
        // Créer une instance PHPMailer
        $mail = new PHPMailer(true);
        
        // Configuration du serveur SMTP
        $mail->isSMTP();
        $mail->Host = $emailHost;
        $mail->SMTPAuth = true;
        $mail->Username = $emailUsername;
        $mail->Password = $emailPassword;
        $mail->SMTPSecure = $emailEncryption === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port = $emailPort;
        
        // Configuration de l'email
        $mail->setFrom($emailFromAddress, $emailFromName);
        $mail->addAddress($to);
        $mail->addReplyTo($emailFromAddress, $emailFromName);
        
        // Contenu
        $mail->isHTML(true);
        $mail->CharSet = 'UTF-8';
        $mail->Subject = $subject;
        $mail->Body = $message;
        
        // Ajouter des en-têtes personnalisés si fournis
        foreach ($headers as $name => $value) {
            $mail->addCustomHeader($name, $value);
        }
        
        $mail->send();
        error_log("Email envoyé avec succès à: $to");
        return true;
        
    } catch (Exception $e) {
        error_log("PHPMailer Exception caught for email to $to: " . $e->getMessage() . " | Mailer ErrorInfo: " . $mail->ErrorInfo);
        return false;
    }
}

/**
 * Envoyer un SMS via Twilio (ou compatible API Twilio)
 *
 * Nécessite les variables d'environnement:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_FROM_NUMBER (format E.164, ex: +33712345678)
 *
 * @param string $to Numéro du destinataire (format E.164, ex: +33612345678)
 * @param string $message Contenu du SMS (160-500 caractères recommandé)
 * @return bool Succès de l'envoi
 */
function sendSms($to, $message) {
    // Charger la configuration Twilio depuis l'env
    $sid = env('TWILIO_ACCOUNT_SID', '');
    $token = env('TWILIO_AUTH_TOKEN', '');
    $from = env('TWILIO_FROM_NUMBER', '');
    $messagingServiceSid = env('TWILIO_MESSAGING_SERVICE_SID', '');

    if (empty($sid) || empty($token)) {
        error_log('SMS non envoyé: configuration Twilio incomplète (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN)');
        return false;
    }
    // Nécessite soit un numéro From soit un Messaging Service SID
    if (empty($from) && empty($messagingServiceSid)) {
        error_log('SMS non envoyé: définir TWILIO_FROM_NUMBER ou TWILIO_MESSAGING_SERVICE_SID');
        return false;
    }

    if (empty($to)) {
        error_log('SMS non envoyé: numéro destinataire vide');
        return false;
    }

    // Nettoyage simple du message
    $body = trim($message ?? '');
    if ($body === '') {
        error_log('SMS non envoyé: message vide');
        return false;
    }

    // Endpoint Twilio
    $url = "https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json";

    $payload = [
        'To' => $to,
        'Body' => $body,
    ];
    if (!empty($messagingServiceSid)) {
        $payload['MessagingServiceSid'] = $messagingServiceSid;
    } else {
        $payload['From'] = $from;
    }
    $postFields = http_build_query($payload);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    curl_setopt($ch, CURLOPT_USERPWD, $sid . ':' . $token);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($response === false) {
        $err = curl_error($ch);
        curl_close($ch);
        error_log('Erreur cURL Twilio: ' . $err);
        return false;
    }
    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300) {
        error_log("SMS envoyé à {$to} ({$httpCode})");
        return true;
    }

    error_log('Echec envoi SMS. HTTP ' . $httpCode . ' Réponse: ' . $response);
    return false;
}

/**
 * Paginer un tableau de résultats
 * 
 * @param array $items Tableau d'éléments à paginer
 * @param int $page Numéro de page (commence à 1)
 * @param int $perPage Nombre d'éléments par page
 * @return array Tableau paginé avec les métadonnées
 */
function paginateArray($items, $page = 1, $perPage = 10) {
    $page = max(1, intval($page));
    $perPage = max(1, intval($perPage));
    $total = count($items);
    $totalPages = ceil($total / $perPage);
    $offset = ($page - 1) * $perPage;
    
    $paginatedItems = array_slice($items, $offset, $perPage);
    
    return [
        'data' => $paginatedItems,
        'meta' => [
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => $totalPages,
            'has_more' => $page < $totalPages
        ]
    ];
}

/**
 * Filtrer un tableau d'éléments selon des critères
 * 
 * @param array $items Tableau d'éléments à filtrer
 * @param array $filters Critères de filtrage (clé => valeur)
 * @return array Tableau filtré
 */
function filterArray($items, $filters) {
    if (empty($filters)) {
        return $items;
    }
    
    return array_filter($items, function($item) use ($filters) {
        foreach ($filters as $key => $value) {
            // Si la clé n'existe pas dans l'élément, ignorer ce filtre
            if (!isset($item[$key])) {
                continue;
            }
            
            // Si la valeur est un tableau, vérifier si la valeur de l'élément est dans le tableau
            if (is_array($value)) {
                if (!in_array($item[$key], $value)) {
                    return false;
                }
            }
            // Sinon, vérifier si les valeurs sont égales
            else if ($item[$key] != $value) {
                return false;
            }
        }
        
        return true;
    });
}

/**
 * Trier un tableau d'éléments
 * 
 * @param array $items Tableau d'éléments à trier
 * @param string $sortBy Clé de tri
 * @param string $sortOrder Ordre de tri (asc ou desc)
 * @return array Tableau trié
 */
function sortArray($items, $sortBy, $sortOrder = 'asc') {
    if (empty($sortBy)) {
        return $items;
    }
    
    usort($items, function($a, $b) use ($sortBy, $sortOrder) {
        // Si la clé n'existe pas dans l'un des éléments, les considérer comme égaux
        if (!isset($a[$sortBy]) || !isset($b[$sortBy])) {
            return 0;
        }
        
        $valueA = $a[$sortBy];
        $valueB = $b[$sortBy];
        
        // Comparer les valeurs
        if ($valueA == $valueB) {
            return 0;
        }
        
        // Déterminer l'ordre de tri
        $result = $valueA < $valueB ? -1 : 1;
        
        // Inverser le résultat si l'ordre est descendant
        if (strtolower($sortOrder) === 'desc') {
            $result = -$result;
        }
        
        return $result;
    });
    
    return $items;
}

/**
 * Rechercher dans un tableau d'éléments
 * 
 * @param array $items Tableau d'éléments à rechercher
 * @param string $query Terme de recherche
 * @param array $fields Champs dans lesquels rechercher
 * @return array Tableau des résultats de recherche
 */
function searchArray($items, $query, $fields) {
    if (empty($query) || empty($fields)) {
        return $items;
    }
    
    $query = strtolower($query);
    
    return array_filter($items, function($item) use ($query, $fields) {
        foreach ($fields as $field) {
            // Si le champ n'existe pas dans l'élément, passer au suivant
            if (!isset($item[$field])) {
                continue;
            }
            
            $value = strtolower($item[$field]);
            
            // Si la valeur contient le terme de recherche, retourner true
            if (strpos($value, $query) !== false) {
                return true;
            }
        }
        
        return false;
    });
}

function sendTelegramMessage($botToken, $chatId, $message) {
    if (empty($botToken) || empty($chatId)) {
        return false;
    }

    $url = "https://api.telegram.org/bot{$botToken}/sendMessage";
    $data = [
        'chat_id' => $chatId,
        'text' => $message,
        'parse_mode' => 'HTML' // Permet d'utiliser des balises comme <b>, <i>
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($data),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Log de la réponse pour le débogage (optionnel, peut être retiré)
    // file_put_contents('telegram_debug.log', date('Y-m-d H:i:s') . " - Response: " . $response . "\n", FILE_APPEND);

    return $httpCode === 200;
}

