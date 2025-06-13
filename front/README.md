# API MySQL pour l'application de rappel d'anniversaires

Cette API permet de stocker et de récupérer les données de l'application de rappel d'anniversaires dans une base de données MySQL.

## Configuration

1. Installez un serveur web local comme XAMPP, WAMP ou MAMP qui inclut PHP et MySQL.
2. Créez une base de données MySQL nommée `birthday_reminder`.
3. Placez tous les fichiers PHP dans un dossier `api` à la racine de votre application.
4. Modifiez le fichier `config.php` pour y mettre vos identifiants de base de données.
5. Accédez à `http://localhost/chemin/vers/votre/app/api/create_tables.php` pour créer les tables nécessaires.

## Structure de la base de données

- **groups** : Stocke les informations sur les groupes
- **birthdays** : Stocke les informations sur les anniversaires
- **notifications** : Stocke les notifications
- **settings** : Stocke les paramètres de l'application

## Sécurité

Cette API utilise une clé API simple pour l'authentification. Dans un environnement de production, vous devriez implémenter une méthode d'authentification plus robuste.

## Mode hors ligne

L'application est conçue pour fonctionner même sans connexion à l'API. Les données sont mises en cache localement dans le navigateur et synchronisées avec la base de données lorsque la connexion est rétablie.