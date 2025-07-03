# Système de Gestion du Cache Automatique

## Vue d'ensemble

Ce système permet de vider automatiquement le cache de l'application à chaque déploiement Git (push/pull), garantissant que les utilisateurs reçoivent toujours la dernière version des fichiers **sans intervention manuelle**.

## Fonctionnement

### 1. Détection de Version
- L'application vérifie la version stockée dans `localStorage` au démarrage
- Si une différence est détectée, le cache est automatiquement vidé
- La nouvelle version est stockée pour les prochaines vérifications

### 2. Types de Cache Vidés

#### Cache Navigateur
- Cache HTTP du navigateur (via l'API `caches`)
- Cache des ressources CSS/JS

#### Cache Application
- Données localStorage de l'application
- Cache des requêtes API
- Paramètres utilisateur non essentiels

#### Cache Serveur
- Cache OpCache PHP
- Fichiers de cache temporaires

## Utilisation

### 🚀 Installation du Système Automatique

#### Première installation (une seule fois)
```batch
# Windows
cache_manager.bat

# Ou directement
install_hooks.bat
```

```bash
# Linux/Mac
chmod +x install_hooks.sh
./install_hooks.sh
```

#### Une fois installé, le système fonctionne automatiquement :
1. **Vous faites un commit** : `git add . && git commit -m "Nouvelle fonctionnalité"`
2. **Vous poussez** : `git push`
3. **Le système se déclenche automatiquement** et vide le cache
4. **Les utilisateurs reçoivent la nouvelle version** sans cache

### 🔧 Gestion du Système

#### Gestionnaire Interactif (Windows)
```batch
# Lancer le gestionnaire
cache_manager.bat
```

Options disponibles :
- ✅ Activer le système
- ❌ Désactiver le système  
- 🧪 Tester le système
- 📊 Voir le statut
- 🔄 Mettre à jour manuellement

### 📋 Déploiement Manuel (si nécessaire)

#### Option 1 : Script Batch (Windows)
```batch
# Exécuter le script de déploiement
deploy.bat
```

#### Option 2 : Script PHP Direct
```bash
# Via ligne de commande
php deploy_version.php

# Via navigateur web
http://votre-site.com/deploy_version.php?deploy=true
```

### Déploiement Manuel

#### Méthode 1 : Modifier la Version
1. Ouvrir le fichier `front/app.js`
2. Modifier la ligne : `const APP_VERSION = '1.0.0';`
3. Remplacer par une nouvelle version (ex: `'1.0.1'`)

#### Méthode 2 : Console JavaScript
```javascript
// Vider le cache manuellement
clearCacheManually();

// Ou utiliser DataManager directement
window.dataManager.clearApplicationCache();
```

## Configuration

### Paramètres Modifiables

Dans `front/app.js` :
```javascript
// Version de l'application
const APP_VERSION = '1.0.0';

// Clé de stockage de la version
const VERSION_STORAGE_KEY = 'app-version';
```

Dans `deploy_version.php` :
```php
// Chemin vers app.js
define('APP_JS_PATH', __DIR__ . '/front/app.js');

// Fichier de version
define('VERSION_FILE', __DIR__ . '/VERSION');

// Dossier de sauvegarde
define('BACKUP_DIR', __DIR__ . '/backups');
```

## Personnalisation

### Ajouter des Éléments de Cache

Pour ajouter de nouveaux éléments au cache à vider :

1. **Dans `app.js`** (fonction `clearApplicationCache`) :
```javascript
const cacheKeys = [
  'app-theme',
  'notification-settings',
  'last-sync-time',
  'user-preferences',
  'votre-nouvelle-cle' // Ajouter ici
];
```

2. **Dans `data-manager.js`** (fonction `clearApiCache`) :
```javascript
const apiCacheKeys = [
  'api_cache_groups',
  'api_cache_birthdays',
  'api_cache_notifications',
  'api_cache_settings',
  'votre-cache-api' // Ajouter ici
];
```

### Modifier le Format de Version

Dans `deploy_version.php`, modifier la fonction `generateNewVersion()` :
```php
function generateNewVersion() {
    // Format timestamp
    return date('Y.m.d.H.i');
    
    // Ou format sémantique
    // return '1.0.' . time();
    
    // Ou format personnalisé
    // return 'v' . date('Ymd') . '-' . substr(md5(time()), 0, 8);
}
```

## Sécurité

### Protection du Script de Déploiement

Le script `deploy_version.php` est protégé contre les accès non autorisés :
- Accès direct via CLI recommandé
- Accès web nécessite le paramètre `?deploy=true`
- Possibilité d'ajouter une authentification supplémentaire

### Sauvegarde Automatique

Le système crée automatiquement des sauvegardes :
- Sauvegarde de `app.js` avant modification
- Conservation des 10 dernières sauvegardes
- Stockage dans le dossier `backups/`

## Dépannage

### Problèmes Courants

1. **PHP non trouvé**
   - Vérifier que PHP est installé
   - Ajouter PHP au PATH système

2. **Permissions de fichiers**
   - Vérifier les permissions d'écriture sur :
     - `front/app.js`
     - `VERSION`
     - `backups/`

3. **Cache non vidé**
   - Vérifier la console JavaScript pour les erreurs
   - Tester manuellement avec `clearCacheManually()`

### Commandes de Débogage

```javascript
// Vérifier la version actuelle
console.log('Version:', localStorage.getItem('app-version'));

// Forcer le vidage du cache
clearCacheManually();

// Vérifier le cache DataManager
window.dataManager.clearApplicationCache();
```

## Logs et Monitoring

Le système génère des logs dans la console :
- Vérification de version au démarrage
- Détection des changements de version
- Statut du vidage du cache
- Erreurs éventuelles

Ces logs peuvent être utilisés pour le monitoring et le débogage.

## 🎯 Fonctionnement Automatique

### Hooks Git Installés

Le système utilise les **hooks Git** pour se déclencher automatiquement :

1. **post-receive** : Se déclenche après chaque `git push`
2. **post-merge** : Se déclenche après chaque `git pull`

### Workflow Automatique

```
1. Vous : git push
2. Git : Déclenche post-receive hook
3. Hook : Exécute deploy_version.php
4. Script : Met à jour APP_VERSION dans app.js
5. Utilisateur : Visite le site
6. App : Détecte nouvelle version
7. App : Vide automatiquement le cache
8. Utilisateur : Reçoit la dernière version
```

### Avantages du Système Automatique

- ✅ **Zéro intervention manuelle** après installation
- ✅ **Fonctionne avec tous les workflows Git**
- ✅ **Compatible push/pull/merge**
- ✅ **Notifications automatiques aux utilisateurs**
- ✅ **Sauvegardes automatiques**
