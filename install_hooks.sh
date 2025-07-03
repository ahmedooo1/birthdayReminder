#!/bin/bash

# Script d'installation des Git Hooks
# Ce script configure automatiquement les hooks Git pour le vidage du cache

echo "=== Installation des Git Hooks pour le vidage automatique du cache ==="

# Fonction pour vérifier si on est dans un dépôt Git
check_git_repo() {
    if [ ! -d ".git" ]; then
        echo "❌ Erreur: Ce répertoire n'est pas un dépôt Git"
        echo "Veuillez exécuter ce script dans le répertoire racine de votre projet Git"
        exit 1
    fi
}

# Fonction pour créer le répertoire des hooks s'il n'existe pas
create_hooks_dir() {
    if [ ! -d ".git/hooks" ]; then
        mkdir -p .git/hooks
        echo "✅ Répertoire .git/hooks créé"
    fi
}

# Fonction pour installer un hook
install_hook() {
    local hook_name="$1"
    local hook_source="hooks/$hook_name"
    local hook_dest=".git/hooks/$hook_name"
    
    if [ -f "$hook_source" ]; then
        cp "$hook_source" "$hook_dest"
        chmod +x "$hook_dest"
        echo "✅ Hook $hook_name installé"
        
        # Mettre à jour le chemin dans le hook
        local current_path=$(pwd)
        sed -i "s|/path/to/your/app|$current_path|g" "$hook_dest"
        echo "   Chemin mis à jour: $current_path"
    else
        echo "❌ Hook source non trouvé: $hook_source"
    fi
}

# Fonction principale
main() {
    echo "Vérification du dépôt Git..."
    check_git_repo
    
    echo "Création du répertoire des hooks..."
    create_hooks_dir
    
    echo "Installation des hooks..."
    install_hook "post-receive"
    install_hook "post-merge"
    
    echo ""
    echo "=== Installation terminée ==="
    echo ""
    echo "Les hooks Git suivants ont été installés :"
    echo "- post-receive : Se déclenche après chaque push"
    echo "- post-merge   : Se déclenche après chaque pull/merge"
    echo ""
    echo "Désormais, à chaque push/pull, la version sera automatiquement"
    echo "mise à jour et le cache sera vidé pour tous les utilisateurs."
    echo ""
    echo "Pour tester, faites un commit et push :"
    echo "git add ."
    echo "git commit -m 'Test auto cache clear'"
    echo "git push"
}

# Exécuter le script
main
