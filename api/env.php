<?php
/**
 * Chargeur de variables d'environnement
 * 
 * Ce fichier charge les variables d'environnement depuis le fichier .env
 */

function loadEnv($path) {
    if (!file_exists($path)) {
        return false;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Ignorer les commentaires
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        // Extraire la variable et sa valeur
        if (strpos($line, '=') !== false) {
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            
            // Supprimer les guillemets autour de la valeur
            if (strpos($value, '"') === 0 && strrpos($value, '"') === strlen($value) - 1) {
                $value = substr($value, 1, -1);
            } elseif (strpos($value, "'") === 0 && strrpos($value, "'") === strlen($value) - 1) {
                $value = substr($value, 1, -1);
            }
            
            // Définir la variable d'environnement
            putenv("$name=$value");
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
    
    return true;
}

// Charger les variables d'environnement
$envPath = __DIR__ . '/../.env';
if (!loadEnv($envPath)) {
    // Si le fichier .env n'existe pas, essayer de copier le fichier .env.example
    if (file_exists(__DIR__ . '/../.env.example')) {
        copy(__DIR__ . '/../.env.example', $envPath);
        loadEnv($envPath);
        
        // Ajouter un message d'avertissement
        error_log('Le fichier .env a été créé à partir de .env.example. Veuillez le configurer avec vos paramètres.');
    } else {
        error_log('Fichier .env non trouvé et .env.example non disponible.');
    }
}

// Fonction pour récupérer une variable d'environnement
function env($key, $default = null) {
    $value = getenv($key);
    if ($value === false) {
        return $default;
    }
    
    // Convertir les valeurs spéciales
    switch (strtolower($value)) {
        case 'true':
        case '(true)':
            return true;
        case 'false':
        case '(false)':
            return false;
        case 'null':
        case '(null)':
            return null;
        case 'empty':
        case '(empty)':
            return '';
    }
    
    return $value;
}

