Comment configurer l'API MySQL

    Installez un serveur web local comme XAMPP, WAMP ou MAMP qui inclut PHP et MySQL.
    Créez une base de données MySQL nommée birthday_reminder.
    Placez tous les fichiers PHP du dossier api dans un dossier api à la racine de votre application.
    Modifiez le fichier config.php pour y mettre vos identifiants de base de données.
    Accédez à http://localhost/chemin/vers/votre/app/api/create_tables.php pour créer les tables nécessaires.

Une fois l'API configurée, l'application se connectera automatiquement à la base de données et synchronisera les données entre tous les postes qui utilisent la même base de données.
Fonctionnement des notifications système

Les notifications système apparaîtront maintenant sur votre bureau lorsque des anniversaires approchent, même si l'application n'est pas ouverte dans le navigateur. Pour que cela fonctionne, vous devez autoriser les notifications dans votre navigateur en cliquant sur le bouton "Autoriser les notifications" dans les paramètres.
