@echo off
REM Script d'installation des Git Hooks pour Windows
REM Ce script configure automatiquement les hooks Git pour le vidage du cache

echo ===================================================
echo  Installation des Git Hooks pour le vidage 
echo  automatique du cache
echo ===================================================

REM Vérifier si on est dans un dépôt Git
if not exist ".git" (
    echo ❌ Erreur: Ce repertoire n'est pas un depot Git
    echo Veuillez executer ce script dans le repertoire racine de votre projet Git
    pause
    exit /b 1
)

REM Créer le répertoire des hooks s'il n'existe pas
if not exist ".git\hooks" (
    mkdir .git\hooks
    echo ✅ Repertoire .git\hooks cree
)

REM Installer le hook post-receive
if exist "hooks\post-receive.bat" (
    copy "hooks\post-receive.bat" ".git\hooks\post-receive.bat"
    echo ✅ Hook post-receive installe
) else (
    echo ❌ Hook source non trouve: hooks\post-receive.bat
)

REM Installer le hook post-merge
if exist "hooks\post-merge" (
    copy "hooks\post-merge" ".git\hooks\post-merge"
    echo ✅ Hook post-merge installe
) else (
    echo ❌ Hook source non trouve: hooks\post-merge
)

echo.
echo ===================================================
echo                Installation terminee
echo ===================================================
echo.
echo Les hooks Git suivants ont ete installes :
echo - post-receive : Se declenche apres chaque push
echo - post-merge   : Se declenche apres chaque pull/merge
echo.
echo Desormais, a chaque push/pull, la version sera automatiquement
echo mise a jour et le cache sera vide pour tous les utilisateurs.
echo.
echo Pour tester, faites un commit et push :
echo git add .
echo git commit -m "Test auto cache clear"
echo git push
echo.
echo Appuyez sur une touche pour continuer...
pause >nul
