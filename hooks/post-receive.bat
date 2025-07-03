@echo off
REM Git Hook pour Windows - Post-receive
REM Ce script se déclenche automatiquement après chaque push Git

echo ===================================================
echo    Git Hook Post-Receive: Debut du deploiement
echo ===================================================

REM Naviguer vers le répertoire de l'application
cd /d "%~dp0.."

REM Vérifier si le script de déploiement existe
if exist "deploy_version.php" (
    echo Execution du script de mise a jour de version...
    
    REM Exécuter le script PHP de déploiement
    php deploy_version.php
    
    if %errorlevel% equ 0 (
        echo ✅ Version mise a jour avec succes
        echo Le cache sera vide automatiquement pour tous les clients
    ) else (
        echo ❌ Erreur lors de la mise a jour de version
        exit /b 1
    )
) else (
    echo ❌ Script deploy_version.php non trouve
    exit /b 1
)

REM Optionnel: Redémarrer les services si nécessaire
REM net stop "Apache2.4"
REM net start "Apache2.4"

echo ===================================================
echo    Git Hook Post-Receive: Deploiement termine
echo ===================================================
