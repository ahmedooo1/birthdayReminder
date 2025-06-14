@echo off
REM Script automatique pour envoyer les rappels d'anniversaire
REM Ce script appelle l'endpoint API automatique

echo [%date% %time%] Demarrage des rappels d'anniversaire...

REM Méthode 1: Via PHP direct
php -f "api/auto_birthday_reminders.php" api_key=bd_12345_auto_reminder_secret_key_change_this

REM Méthode 2: Via curl (si disponible)
REM curl -s "http://localhost/api/auto_birthday_reminders.php?api_key=bd_12345_auto_reminder_secret_key_change_this"

echo [%date% %time%] Rappels d'anniversaire termines.

REM Ajouter au log
echo [%date% %time%] Execution terminee >> birthday_reminders.log
