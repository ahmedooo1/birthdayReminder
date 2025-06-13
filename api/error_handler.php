<?php
/**
 * Gestionnaire d'erreurs pour l'API
 * 
 * Ce fichier contient les fonctions et classes pour gérer les erreurs de manière cohérente
 */

// Définir les types d'erreurs
define('ERROR_VALIDATION', 'validation');
define('ERROR_AUTHENTICATION', 'authentication');
define('ERROR_AUTHORIZATION', 'authorization');
define('ERROR_NOT_FOUND', 'not_found');
define('ERROR_DATABASE', 'database');
define('ERROR_SERVER', 'server');

/**
 * Classe pour représenter une erreur d'API
 */
class ApiError extends Exception {
    protected $type;
    protected $details;
    protected $httpCode;
    
    /**
     * Constructeur
     * 
     * @param string $message Message d'erreur
     * @param string $type Type d'erreur
     * @param array $details Détails supplémentaires
     * @param int $httpCode Code HTTP
     */
    public function __construct($message, $type = ERROR_SERVER, $details = [], $httpCode = 500) {
        parent::__construct($message);
        $this->type = $type;
        $this->details = $details;
        $this->httpCode = $httpCode;
    }
    
    /**
     * Obtenir le type d'erreur
     * 
     * @return string Type d'erreur
     */
    public function getType() {
        return $this->type;
    }
    
    /**
     * Obtenir les détails de l'erreur
     * 
     * @return array Détails de l'erreur
     */
    public function getDetails() {
        return $this->details;
    }
    
    /**
     * Obtenir le code HTTP
     * 
     * @return int Code HTTP
     */
    public function getHttpCode() {
        return $this->httpCode;
    }
    
    /**
     * Convertir l'erreur en tableau
     * 
     * @return array Représentation de l'erreur sous forme de tableau
     */
    public function toArray() {
        return [
            'error' => true,
            'type' => $this->type,
            'message' => $this->getMessage(),
            'details' => $this->details
        ];
    }
}

/**
 * Erreur de validation
 */
class ValidationError extends ApiError {
    public function __construct($message, $details = []) {
        parent::__construct($message, ERROR_VALIDATION, $details, 400);
    }
}

/**
 * Erreur d'authentification
 */
class AuthenticationError extends ApiError {
    public function __construct($message, $details = []) {
        parent::__construct($message, ERROR_AUTHENTICATION, $details, 401);
    }
}

/**
 * Erreur d'autorisation
 */
class AuthorizationError extends ApiError {
    public function __construct($message, $details = []) {
        parent::__construct($message, ERROR_AUTHORIZATION, $details, 403);
    }
}

/**
 * Erreur de ressource non trouvée
 */
class NotFoundError extends ApiError {
    public function __construct($message, $details = []) {
        parent::__construct($message, ERROR_NOT_FOUND, $details, 404);
    }
}

/**
 * Erreur de base de données
 */
class DatabaseError extends ApiError {
    public function __construct($message, $details = []) {
        parent::__construct($message, ERROR_DATABASE, $details, 500);
    }
}

/**
 * Fonction pour gérer les erreurs et envoyer une réponse appropriée
 * 
 * @param Exception $e Exception à gérer
 */
function handleError($e) {
    if ($e instanceof ApiError) {
        sendResponse($e->toArray(), $e->getHttpCode());
    } else {
        // Journaliser l'erreur
        error_log($e->getMessage() . "\n" . $e->getTraceAsString());
        
        // En production, ne pas exposer les détails de l'erreur
        if (env('APP_DEBUG', false)) {
            sendResponse([
                'error' => true,
                'type' => ERROR_SERVER,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTrace()
            ], 500);
        } else {
            sendResponse([
                'error' => true,
                'type' => ERROR_SERVER,
                'message' => 'Une erreur interne est survenue.'
            ], 500);
        }
    }
}

/**
 * Fonction pour valider les données d'entrée
 * 
 * @param array $data Données à valider
 * @param array $rules Règles de validation
 * @throws ValidationError Si la validation échoue
 * @return array Données validées
 */
function validateInput($data, $rules) {
    $errors = [];
    $validated = [];
    
    foreach ($rules as $field => $rule) {
        // Vérifier si le champ est requis
        if (isset($rule['required']) && $rule['required'] && (!isset($data[$field]) || $data[$field] === '')) {
            $errors[$field] = 'Ce champ est requis';
            continue;
        }
        
        // Si le champ n'est pas présent et n'est pas requis, passer à la règle suivante
        if (!isset($data[$field])) {
            continue;
        }
        
        $value = $data[$field];
        
        // Valider le type
        if (isset($rule['type'])) {
            switch ($rule['type']) {
                case 'string':
                    if (!is_string($value)) {
                        $errors[$field] = 'Ce champ doit être une chaîne de caractères';
                        continue 2;
                    }
                    break;
                case 'integer':
                    if (!is_numeric($value) || intval($value) != $value) {
                        $errors[$field] = 'Ce champ doit être un nombre entier';
                        continue 2;
                    }
                    $value = intval($value);
                    break;
                case 'float':
                    if (!is_numeric($value)) {
                        $errors[$field] = 'Ce champ doit être un nombre';
                        continue 2;
                    }
                    $value = floatval($value);
                    break;
                case 'boolean':
                    if (!is_bool($value) && $value !== '0' && $value !== '1' && $value !== 0 && $value !== 1) {
                        $errors[$field] = 'Ce champ doit être un booléen';
                        continue 2;
                    }
                    $value = (bool)$value;
                    break;
                case 'email':
                    if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                        $errors[$field] = 'Ce champ doit être une adresse email valide';
                        continue 2;
                    }
                    break;
                case 'date':
                    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
                        $errors[$field] = 'Ce champ doit être une date au format YYYY-MM-DD';
                        continue 2;
                    }
                    break;
            }
        }
        
        // Valider la longueur minimale
        if (isset($rule['min_length']) && strlen($value) < $rule['min_length']) {
            $errors[$field] = "Ce champ doit contenir au moins {$rule['min_length']} caractères";
            continue;
        }
        
        // Valider la longueur maximale
        if (isset($rule['max_length']) && strlen($value) > $rule['max_length']) {
            $errors[$field] = "Ce champ doit contenir au maximum {$rule['max_length']} caractères";
            continue;
        }
        
        // Valider la valeur minimale
        if (isset($rule['min']) && $value < $rule['min']) {
            $errors[$field] = "Ce champ doit être supérieur ou égal à {$rule['min']}";
            continue;
        }
        
        // Valider la valeur maximale
        if (isset($rule['max']) && $value > $rule['max']) {
            $errors[$field] = "Ce champ doit être inférieur ou égal à {$rule['max']}";
            continue;
        }
        
        // Valider avec une expression régulière
        if (isset($rule['pattern']) && !preg_match($rule['pattern'], $value)) {
            $errors[$field] = $rule['pattern_message'] ?? 'Ce champ ne respecte pas le format requis';
            continue;
        }
        
        // Valider avec une liste de valeurs autorisées
        if (isset($rule['enum']) && !in_array($value, $rule['enum'])) {
            $errors[$field] = 'Ce champ doit être l\'une des valeurs suivantes: ' . implode(', ', $rule['enum']);
            continue;
        }
        
        // Valider avec une fonction personnalisée
        if (isset($rule['custom']) && is_callable($rule['custom'])) {
            $customError = $rule['custom']($value);
            if ($customError !== true) {
                $errors[$field] = $customError;
                continue;
            }
        }
        
        // Si toutes les validations sont passées, ajouter la valeur aux données validées
        $validated[$field] = $value;
    }
    
    // S'il y a des erreurs, lancer une exception
    if (!empty($errors)) {
        throw new ValidationError('Erreur de validation', $errors);
    }
    
    return $validated;
}

// Définir un gestionnaire d'exceptions global
set_exception_handler('handleError');

