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
    $dateObj = new DateTime($date);
    return $dateObj->format($format);
}

/**
 * Calculer l'âge à partir d'une date de naissance
 * 
 * @param string $birthdate Date de naissance au format YYYY-MM-DD
 * @return int Âge en années
 */
function calculateAge($birthdate) {
    $birth = new DateTime($birthdate);
    $now = new DateTime();
    $interval = $now->diff($birth);
    return $interval->y;
}

/**
 * Calculer le nombre de jours jusqu'au prochain anniversaire
 * 
 * @param string $birthdate Date de naissance au format YYYY-MM-DD
 * @return int Nombre de jours
 */
function daysUntilNextBirthday($birthdate) {
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
}

/**
 * Obtenir la date du prochain anniversaire
 * 
 * @param string $birthdate Date de naissance au format YYYY-MM-DD
 * @return string Date du prochain anniversaire au format YYYY-MM-DD
 */
function getNextBirthdayDate($birthdate) {
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

