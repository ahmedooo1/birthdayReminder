<?php
/**
 * Script de déploiement automatique - Mise à jour de la version
 * Ce script met à jour automatiquement la version de l'application
 * pour déclencher le vidage du cache côté client
 */

// Configuration
define('APP_JS_PATH', __DIR__ . '/front/app.js');
define('VERSION_FILE', __DIR__ . '/VERSION');
define('BACKUP_DIR', __DIR__ . '/backups');

/**
 * Génère une nouvelle version basée sur le timestamp
 */
function generateNewVersion() {
    $timestamp = date('Y.m.d.H.i');
    return $timestamp;
}

/**
 * Met à jour la version dans le fichier app.js
 */
function updateVersionInAppJs($newVersion) {
    if (!file_exists(APP_JS_PATH)) {
        throw new Exception("Le fichier app.js n'existe pas : " . APP_JS_PATH);
    }
    
    $content = file_get_contents(APP_JS_PATH);
    
    // Rechercher et remplacer la ligne de version
    $pattern = '/const APP_VERSION = [\'"]([^\'"]+)[\'"];/';
    $replacement = "const APP_VERSION = '$newVersion';";
    
    $newContent = preg_replace($pattern, $replacement, $content);
    
    if ($newContent === $content) {
        throw new Exception("Impossible de trouver la ligne APP_VERSION dans app.js");
    }
    
    // Créer un backup avant modification
    createBackup();
    
    file_put_contents(APP_JS_PATH, $newContent);
    
    return true;
}

/**
 * Crée un backup du fichier app.js
 */
function createBackup() {
    if (!is_dir(BACKUP_DIR)) {
        mkdir(BACKUP_DIR, 0755, true);
    }
    
    $backupName = 'app_' . date('Y-m-d_H-i-s') . '.js';
    $backupPath = BACKUP_DIR . '/' . $backupName;
    
    copy(APP_JS_PATH, $backupPath);
    
    // Garder seulement les 10 derniers backups
    $backups = glob(BACKUP_DIR . '/app_*.js');
    if (count($backups) > 10) {
        usort($backups, function($a, $b) {
            return filemtime($a) - filemtime($b);
        });
        
        $toDelete = array_slice($backups, 0, count($backups) - 10);
        foreach ($toDelete as $file) {
            unlink($file);
        }
    }
}

/**
 * Sauvegarde la version actuelle
 */
function saveCurrentVersion($version) {
    file_put_contents(VERSION_FILE, $version);
}

/**
 * Récupère la version actuelle
 */
function getCurrentVersion() {
    if (file_exists(VERSION_FILE)) {
        return trim(file_get_contents(VERSION_FILE));
    }
    return null;
}

/**
 * Vide le cache du serveur (opcache)
 */
function clearServerCache() {
    if (function_exists('opcache_reset')) {
        opcache_reset();
        echo "Cache OpCache vidé.\n";
    }
    
    // Créer un fichier de timestamp pour invalider les caches
    $cacheFile = __DIR__ . '/cache_timestamp.txt';
    file_put_contents($cacheFile, time());
    echo "Timestamp de cache mis à jour.\n";
}

/**
 * Script principal
 */
function main() {
    try {
        echo "=== Déploiement automatique - Mise à jour de version ===\n";
        
        $currentVersion = getCurrentVersion();
        echo "Version actuelle : " . ($currentVersion ?: 'Non définie') . "\n";
        
        $newVersion = generateNewVersion();
        echo "Nouvelle version : $newVersion\n";
        
        // Mettre à jour la version dans app.js
        updateVersionInAppJs($newVersion);
        echo "Version mise à jour dans app.js\n";
        
        // Sauvegarder la nouvelle version
        saveCurrentVersion($newVersion);
        echo "Version sauvegardée dans VERSION\n";
        
        // Vider le cache du serveur
        clearServerCache();
        
        echo "=== Déploiement terminé avec succès ===\n";
        echo "La nouvelle version $newVersion va déclencher le vidage du cache client.\n";
        
    } catch (Exception $e) {
        echo "ERREUR : " . $e->getMessage() . "\n";
        exit(1);
    }
}

// Exécuter le script si appelé directement
if (php_sapi_name() === 'cli') {
    main();
} else {
    // Si appelé via HTTP, vérifier les permissions
    if (!isset($_GET['deploy']) || $_GET['deploy'] !== 'true') {
        http_response_code(403);
        echo "Accès interdit";
        exit;
    }
    
    // Capturer la sortie pour l'affichage web
    ob_start();
    main();
    $output = ob_get_clean();
    
    echo "<pre>$output</pre>";
}
?>
