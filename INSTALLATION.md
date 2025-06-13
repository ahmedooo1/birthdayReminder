# Guide d'installation - Birthday Reminder

Ce guide vous explique comment installer et configurer l'application Birthday Reminder sur votre serveur.

## Prérequis

- PHP 7.4 ou supérieur
- SQLite 3 ou MySQL 5.7+ / MariaDB 10.3+
- Serveur web (Apache, Nginx, etc.)
- Accès à la ligne de commande (pour l'installation initiale)

## Installation

### 1. Téléchargement et extraction

1. Téléchargez le fichier ZIP de l'application
2. Extrayez le contenu dans le répertoire de votre choix sur votre serveur web
3. Assurez-vous que les permissions sont correctement configurées :

```bash
chmod -R 755 /chemin/vers/birthdayReminder
chmod -R 777 /chemin/vers/birthdayReminder/data
```

### 2. Configuration de la base de données

L'application peut utiliser SQLite (par défaut) ou MySQL. Choisissez l'option qui vous convient :

#### Option 1 : SQLite (plus simple)

1. Aucune configuration supplémentaire n'est nécessaire
2. La base de données sera automatiquement créée dans le fichier `birthday_reminder.db`
3. Assurez-vous que le répertoire racine de l'application est accessible en écriture par le serveur web

#### Option 2 : MySQL (recommandé pour les déploiements en production)

1. Créez une base de données MySQL :

```sql
CREATE DATABASE birthday_reminder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Créez un utilisateur MySQL et accordez-lui les privilèges nécessaires :

```sql
CREATE USER 'birthday_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON birthday_reminder.* TO 'birthday_user'@'localhost';
FLUSH PRIVILEGES;
```

3. Importez le schéma de la base de données :

```bash
mysql -u birthday_user -p birthday_reminder < /chemin/vers/birthdayReminder/database/mysql_schema.sql
```

### 3. Configuration de l'application

1. Copiez le fichier `.env.example` en `.env` :

```bash
cp /chemin/vers/birthdayReminder/.env.example /chemin/vers/birthdayReminder/.env
```

2. Modifiez le fichier `.env` selon vos besoins :

```
# Pour utiliser SQLite (par défaut)
DB_TYPE=sqlite
SQLITE_PATH=./birthday_reminder.db

# Pour utiliser MySQL
# DB_TYPE=mysql
# MYSQL_HOST=localhost
# MYSQL_PORT=3306
# MYSQL_DATABASE=birthday_reminder
# MYSQL_USER=birthday_user
# MYSQL_PASSWORD=votre_mot_de_passe

# Configuration de l'application
APP_NAME="Birthday Reminder"
APP_DEBUG=false
APP_URL=https://votre-domaine.com
API_KEY=votre_cle_api_secrete

# Configuration des sessions
SESSION_LIFETIME=86400

# Configuration des emails (optionnel)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=votre_email@gmail.com
MAIL_PASSWORD=votre_mot_de_passe_app
MAIL_FROM_NAME="Birthday Reminder"
MAIL_FROM_ADDRESS=votre_email@gmail.com

# Configuration des notifications
NOTIFICATION_DAYS=3
```

### 4. Initialisation de la base de données

#### Pour SQLite

```bash
php /chemin/vers/birthdayReminder/api/init_sqlite.php
```

#### Pour MySQL

```bash
php /chemin/vers/birthdayReminder/database/setup_mysql.php
```

### 5. Configuration du serveur web

#### Apache

Créez un fichier `.htaccess` dans le répertoire racine de l'application :

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # Rediriger toutes les requêtes vers le front/index.html sauf pour /api
    RewriteCond %{REQUEST_URI} !^/api/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ front/index.html [L]
</IfModule>

# Protection des fichiers sensibles
<FilesMatch "^\.env|\.gitignore|composer\.json|composer\.lock|package\.json|package-lock\.json|README\.md|INSTALLATION\.md">
    Order allow,deny
    Deny from all
</FilesMatch>

# Protection du répertoire data
<IfModule mod_rewrite.c>
    RewriteRule ^data/ - [F,L]
</IfModule>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    root /chemin/vers/birthdayReminder;
    
    index front/index.html;
    
    location / {
        try_files $uri $uri/ /front/index.html;
    }
    
    location /api/ {
        try_files $uri $uri/ /api/index.php?$query_string;
    }
    
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
    }
    
    # Protection des fichiers sensibles
    location ~ /\.env|\.gitignore|composer\.json|composer\.lock|package\.json|package-lock\.json|README\.md|INSTALLATION\.md {
        deny all;
    }
    
    # Protection du répertoire data
    location /data/ {
        deny all;
    }
}
```

### 6. Configuration des tâches planifiées (optionnel)

Pour envoyer des notifications par email, configurez une tâche cron qui exécute le script de notification quotidiennement :

```bash
# Ajouter cette ligne à votre crontab (crontab -e)
0 0 * * * php /chemin/vers/birthdayReminder/api/send_notifications.php
```

## Migration depuis SQLite vers MySQL

Si vous avez déjà utilisé l'application avec SQLite et souhaitez migrer vers MySQL :

1. Configurez MySQL comme indiqué dans la section "Option 2 : MySQL"
2. Modifiez le fichier `.env` pour utiliser MySQL
3. Exécutez le script de migration :

```bash
php /chemin/vers/birthdayReminder/database/migrate_sqlite_to_mysql.php
```

## Utilisateur par défaut

Un utilisateur de démonstration est créé automatiquement lors de l'initialisation de la base de données :

- Nom d'utilisateur : `admin`
- Mot de passe : `admin123`

**Important** : Changez ce mot de passe immédiatement après la première connexion !

## Dépannage

### Problèmes de connexion à la base de données

- Vérifiez que les informations de connexion dans le fichier `.env` sont correctes
- Assurez-vous que l'utilisateur MySQL a les privilèges nécessaires
- Vérifiez que le fichier SQLite est accessible en lecture/écriture par le serveur web

### Problèmes d'affichage

- Videz le cache de votre navigateur
- Vérifiez que les fichiers JavaScript et CSS sont correctement chargés (inspecteur du navigateur)
- Assurez-vous que le serveur web est correctement configuré

### Problèmes d'envoi d'email

- Vérifiez que les informations SMTP dans le fichier `.env` sont correctes
- Si vous utilisez Gmail, assurez-vous d'avoir activé l'accès aux applications moins sécurisées ou d'utiliser un mot de passe d'application
- Vérifiez les logs du serveur pour plus d'informations

## Support

Si vous rencontrez des problèmes lors de l'installation ou de l'utilisation de l'application, veuillez consulter la documentation ou contacter le support.

