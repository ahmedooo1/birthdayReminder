@echo off
setlocal enabledelayedexpansion

REM Script de gestion du système de cache automatique
REM Permet d'activer, désactiver et configurer le système

:MENU
cls
echo ================================================
echo     GESTIONNAIRE DE CACHE AUTOMATIQUE
echo ================================================
echo.
echo 1. Activer le systeme (installer les hooks Git)
echo 2. Desactiver le systeme (supprimer les hooks Git)
echo 3. Tester le systeme (vider le cache manuellement)
echo 4. Voir le statut actuel
echo 5. Mettre a jour la version manuellement
echo 6. Quitter
echo.
set /p choice=Choisissez une option (1-6): 

if "%choice%"=="1" goto INSTALL
if "%choice%"=="2" goto UNINSTALL
if "%choice%"=="3" goto TEST
if "%choice%"=="4" goto STATUS
if "%choice%"=="5" goto UPDATE_VERSION
if "%choice%"=="6" goto EXIT

echo Option invalide. Veuillez choisir entre 1 et 6.
pause
goto MENU

:INSTALL
echo.
echo Installation des hooks Git...
if exist "install_hooks.bat" (
    call install_hooks.bat
) else (
    echo ❌ Script install_hooks.bat non trouve
)
pause
goto MENU

:UNINSTALL
echo.
echo Suppression des hooks Git...
if exist ".git\hooks\post-receive.bat" (
    del ".git\hooks\post-receive.bat"
    echo ✅ Hook post-receive supprime
)
if exist ".git\hooks\post-merge" (
    del ".git\hooks\post-merge"
    echo ✅ Hook post-merge supprime
)
echo Systeme desactive.
pause
goto MENU

:TEST
echo.
echo Test du systeme - Vidage manuel du cache...
if exist "deploy_version.php" (
    php deploy_version.php
    echo.
    echo Le cache sera vide au prochain chargement de l'application.
) else (
    echo ❌ Script deploy_version.php non trouve
)
pause
goto MENU

:STATUS
echo.
echo === STATUT DU SYSTEME ===
echo.

REM Vérifier si on est dans un dépôt Git
if exist ".git" (
    echo ✅ Depot Git: OUI
) else (
    echo ❌ Depot Git: NON
)

REM Vérifier les hooks
if exist ".git\hooks\post-receive.bat" (
    echo ✅ Hook post-receive: INSTALLE
) else (
    echo ❌ Hook post-receive: NON INSTALLE
)

if exist ".git\hooks\post-merge" (
    echo ✅ Hook post-merge: INSTALLE
) else (
    echo ❌ Hook post-merge: NON INSTALLE
)

REM Vérifier les fichiers nécessaires
if exist "deploy_version.php" (
    echo ✅ Script de deploiement: PRESENT
) else (
    echo ❌ Script de deploiement: ABSENT
)

REM Vérifier la version actuelle
if exist "VERSION" (
    echo ✅ Fichier VERSION: PRESENT
    set /p current_version=<VERSION
    echo    Version actuelle: !current_version!
) else (
    echo ❌ Fichier VERSION: ABSENT
)

REM Vérifier PHP
php --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PHP: DISPONIBLE
) else (
    echo ❌ PHP: NON DISPONIBLE
)

echo.
pause
goto MENU

:UPDATE_VERSION
echo.
echo Mise a jour manuelle de la version...
if exist "deploy_version.php" (
    php deploy_version.php
    echo.
    echo Version mise a jour avec succes!
) else (
    echo ❌ Script deploy_version.php non trouve
)
pause
goto MENU

:EXIT
echo.
echo Au revoir!
exit /b 0
