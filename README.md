# Birthday Reminder

Une application web pour gérer et recevoir des rappels d'anniversaires.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![PHP](https://img.shields.io/badge/PHP-7.4+-green.svg)
![SQLite](https://img.shields.io/badge/SQLite-3.0+-orange.svg)
![MySQL](https://img.shields.io/badge/MySQL-5.7+-purple.svg)

## Fonctionnalités :

- Optionnel : Rappels SMS via Twilio

## Captures d'écran

    <img src="screenshots/add_birthday.png" alt="Ajout d'anniversaire" width="400"/>
    <img src="screenshots/groups.png" alt="Gestion des groupes" width="400"/>
</div>

## Prérequis

- PHP 7.4 ou supérieur
    - Pour SMS (optionnel) : définissez `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` (format E.164, par exemple +33612345678)
- SQLite 3 ou MySQL 5.7+ / MariaDB 10.3+
- Serveur web (Apache, Nginx, etc.)

- Pour activer les préférences SMS, assurez-vous que les colonnes existent. Soit réexécutez le schéma, soit visitez `api/add_sms_columns.php` une fois pour ajouter : `users.phone_number`, `users.sms_notifications`, et les champs Twilio dans `app_settings`.

1. Téléchargez et extrayez l'archive dans votre répertoire web
2. Assurez-vous que les permissions sont correctement configurées
- Lorsque les SMS sont configurés et que les utilisateurs ont opté pour un numéro de téléphone, le cron enverra également des rappels SMS.
4. Suivez l'assistant d'installation

Pour des instructions détaillées, consultez le [Guide d'installation](INSTALLATION.md).

## Configuration

L'application peut utiliser soit SQLite (par défaut), soit MySQL comme base de données. Pour configurer l'application, copiez le fichier `.env.example` en `.env` et modifiez-le selon vos besoins.

### Exemple de configuration SQLite

```
DB_TYPE=sqlite
SQLITE_PATH=./birthday_reminder.db
```

### Exemple de configuration MySQL

```
DB_TYPE=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=birthday_reminder
MYSQL_USER=birthday_user
MYSQL_PASSWORD=votre_mot_de_passe
```

## Documentation

- [Guide d'installation](INSTALLATION.md) - Instructions détaillées pour installer l'application
- [Guide d'utilisation](USER_GUIDE.md) - Guide complet pour utiliser l'application
- [Documentation de la base de données](DATABASE.md) - Structure et schéma de la base de données
- [Rapport de tests](tests/test_report.md) - Résultats des tests de l'application

## Migration depuis SQLite vers MySQL

Si vous avez déjà utilisé l'application avec SQLite et souhaitez migrer vers MySQL, suivez ces étapes :

1. Configurez MySQL comme indiqué dans le [Guide d'installation](INSTALLATION.md)
2. Exécutez le script de migration :

```bash
php database/migrate_sqlite_to_mysql.php
```

## Développement

### Structure du projet

```
birthdayReminder/
├── api/                 # Backend PHP
│   ├── auth.php         # Authentification
│   ├── birthdays.php    # Gestion des anniversaires
│   ├── config.php       # Configuration
│   ├── create_tables.php # Création des tables SQLite
│   ├── error_handler.php # Gestion des erreurs
│   ├── groupes.php      # Gestion des groupes
│   ├── send_notifications.php # Envoi des notifications
│   └── utils.php        # Fonctions utilitaires
├── database/            # Scripts de base de données
│   ├── migrate_sqlite_to_mysql.php # Migration SQLite vers MySQL
│   ├── mysql_schema.sql # Schéma MySQL
│   ├── setup_mysql.php  # Configuration MySQL
│   └── test_mysql_connection.php # Test de connexion MySQL
├── front/               # Frontend
│   ├── app.js           # Application principale
│   ├── auth-manager.js  # Gestion de l'authentification
│   ├── calendar.js      # Composant calendrier
│   ├── data-manager.js  # Gestion des données
│   ├── index.html       # Page principale
│   ├── notification-manager.js # Gestion des notifications
│   └── styles.css       # Styles CSS
├── tests/               # Tests
│   ├── run_tests.html   # Interface de test
│   ├── test_api.php     # Tests de l'API
│   ├── test_mobile_compatibility.js # Tests de compatibilité mobile
│   ├── test_performance.js # Tests de performance
│   └── test_report.md   # Rapport de test
├── .env                 # Variables d'environnement
├── .env.example         # Exemple de variables d'environnement
├── DATABASE.md          # Documentation de la base de données
├── INSTALLATION.md      # Guide d'installation
├── README.md            # Ce fichier
└── USER_GUIDE.md        # Guide d'utilisation
```

### Contribuer

Les contributions sont les bienvenues ! Si vous souhaitez contribuer au projet, veuillez suivre ces étapes :

1. Forkez le dépôt
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'Add some amazing feature'`)
4. Poussez vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.



