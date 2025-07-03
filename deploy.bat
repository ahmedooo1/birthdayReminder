@echo off
echo ===========================================
echo    SCRIPT DE DEPLOIEMENT AUTOMATIQUE
echo ===========================================
echo.

REM Vérifier si PHP est disponible
php --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: PHP n'est pas installé ou accessible
    echo Veuillez installer PHP ou l'ajouter au PATH
    pause
    exit /b 1
)

echo Execution du script de mise a jour de version...
echo.

REM Exécuter le script PHP de déploiement
php deploy_version.php

if %errorlevel% equ 0 (
    echo.
    echo ===========================================
    echo    DEPLOIEMENT TERMINE AVEC SUCCES!
    echo ===========================================
    echo.
    echo Le cache sera automatiquement vide pour
    echo tous les utilisateurs lors de leur 
    echo prochaine visite.
    echo.
) else (
    echo.
    echo ===========================================
    echo         ERREUR LORS DU DEPLOIEMENT
    echo ===========================================
    echo.
    echo Veuillez verifier les messages d'erreur
    echo ci-dessus et corriger les problemes.
    echo.
)

echo Appuyez sur une touche pour continuer...
pause >nul
