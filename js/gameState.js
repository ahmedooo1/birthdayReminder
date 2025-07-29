/**
 * Gestion de l'état du jeu avec la persistance localStorage
 */

// Clé pour le stockage dans localStorage
const STORAGE_KEY = 'propertyGameState';

/**
 * Obtient l'état du jeu depuis localStorage ou utilise l'état initial
 */
function getGameState() {
    const savedState = localStorage.getItem(STORAGE_KEY);
    return savedState ? JSON.parse(savedState) : INITIAL_GAME_STATE;
}

/**
 * Met à jour l'état du jeu et le sauvegarde dans localStorage
 */
function updateGameState(newState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    return newState;
}

/**
 * Réinitialise l'état du jeu (supprime du localStorage)
 */
function resetGameState() {
    // Supprime spécifiquement la clé du jeu
    localStorage.removeItem(STORAGE_KEY);
    
  
    // Crée une copie profonde de l'état initial
    const freshState = JSON.parse(JSON.stringify(INITIAL_GAME_STATE));
    
    // S'assure que tous les scores sont à 0
    Object.keys(freshState.teams).forEach(teamId => {
        freshState.teams[teamId].score = 0;
        freshState.teams[teamId].position = 0;
                freshState.teams[teamId].players = [
            { name: 'Joueur 1', score: 0, scoreHistory: [0] },
            { name: 'Joueur 2', score: 0, scoreHistory: [0] },
            { name: 'Joueur 3', score: 0, scoreHistory: [0] },
            { name: 'Joueur 4', score: 0, scoreHistory: [0] }
        ];  // Les noms seront mis à jour via saveTeamSetup
        freshState.teams[teamId].currentPlayer = 0;  // Index du joueur actuel
    });
    
    // Réinitialise les valeurs de jeu
    freshState.currentTurn = 1;
    freshState.activeCard = null;
    freshState.dice = 1;
    freshState.gameTime = 30 * 60; // 30 minutes
    freshState.timerStarted = false;
    freshState.gameBoard = generateInitialBoard();
    
    console.log("État du jeu réinitialisé avec succès, tous les scores sont à 0");
    
    return freshState;
}
function updatePlayerTurn(player, turnData) {
    if (!player.turnHistory) {
        player.turnHistory = [];  // Initialiser si absent
    }
    player.turnHistory.push(turnData);  // turnData est maintenant un objet { description, cardTitle }
}
function recalcTeamScore(teamId) {
    const gameState = getGameState();
    const team = gameState.teams[teamId];
    if (!team) return;

    team.score = team.players.reduce((sum, player) => sum + (player.score || 0), 0);
    updateGameState(gameState);
}
document.addEventListener('DOMContentLoaded', function() {
    const teamCards = document.querySelectorAll('.team-card');

    teamCards.forEach(teamCard => {
        const checkbox = teamCard.querySelector('.toggle input[type="checkbox"]');
        const playerInputs = teamCard.querySelectorAll('.player-input');

        checkbox.addEventListener('change', function() {
            if (this.checked) {
                // Remplir uniquement le premier champ avec une valeur par défaut
                if (playerInputs[0]) {
                    playerInputs[0].value = `Joueur 1`;
                }
            } else {
                // Vider tous les champs si l'équipe est désactivée
                playerInputs.forEach(input => {
                    input.value = '';
                });
            }
            // Sauvegarder la configuration de l'équipe
            saveTeamSetup();
        });
    });
});
/**
 * Met à jour le score d'une équipe
 */
function updateTeamScore(teamId, amount) {
    const gameState = getGameState();
    
    if (gameState.teams[teamId] && gameState.teams[teamId].players.length > 0) {
        const currentPlayerIndex = gameState.teams[teamId].currentPlayer;
        const player = gameState.teams[teamId].players[currentPlayerIndex];
        
        if (!player || typeof player !== 'object') {
            console.error(`Erreur : Le joueur n'est pas un objet valide pour l'équipe ${teamId}.`);
            return gameState;  // Arrêter pour éviter l'erreur
        }
        
        const numAmount = Number(amount);
        
        if (!player.scoreHistory) {
            player.scoreHistory = [0];  // Initialiser si absent
        }
        
        player.score = player.score || 0;  // Initialiser score si absent
        player.score += numAmount;
        player.scoreHistory.push(player.score);  // Ajoute le nouveau score
        
        gameState.teams[teamId].score += numAmount;  // Mettre à jour le score d'équipe si nécessaire
        
        console.log(`Joueur ${currentPlayerIndex + 1} de l'équipe ${teamId} : Score mis à jour de ${player.score - numAmount} à ${player.score}`);
        
        updateGameState(gameState);
    } else {
        console.error(`Team with ID ${teamId} not found or no players`);
    }
    
    return gameState;
}
/**
 * Passe au tour suivant
 */
function advanceTurn() {
    const gameState = getGameState();
    const activeTeam = gameState.teams[gameState.activeTeam];

    if (!activeTeam) return gameState;

    // Move to the next player in the active team
    activeTeam.currentPlayer = (activeTeam.currentPlayer + 1) % activeTeam.players.length;

    // If we loop back to the first player, switch to the next team
    if (activeTeam.currentPlayer === 0) {
        gameState.activeTeam = getNextActiveTeam(gameState.activeTeam, gameState.teams);
    }

    // Increment the turn counter
    gameState.currentTurn++;

    return updateGameState(gameState);
}

/**
 * Met à jour les joueurs d'une équipe
 */
function updateTeamPlayers(teamId, players) {
    const gameState = getGameState();
    
    if (gameState.teams[teamId]) {
        gameState.teams[teamId].players = players;
        updateGameState(gameState);
    }
    
    return gameState;
}

/**
 * Met à jour l'état actif d'une équipe
 */
function updateTeamActive(teamId, isActive) {
    const gameState = getGameState();
    
    if (gameState.teams[teamId]) {
        gameState.teams[teamId].active = isActive;
        updateGameState(gameState);

    }
    
    return gameState;
}

/**
 * Met à jour la valeur du dé
 */
function updateDiceValue(value) {
    const gameState = getGameState();
    gameState.dice = value;
    return updateGameState(gameState);
}

/**
 * Définit la carte active
 */
function setActiveCard(cardId) {
    const gameState = getGameState();
    gameState.activeCard = cardId;
    return updateGameState(gameState);
}

/**
 * Met à jour la position du joueur actif selon le nombre de pas indiqué par le dé
 */
function movePlayer(steps) {
    const gameState = getGameState();
    
    // Récupère ou initialise la position actuelle
    if (!gameState.teams[gameState.activeTeam].position) {
        gameState.teams[gameState.activeTeam].position = 0;
    }
    
    // Calcule la nouvelle position
    const currentPosition = gameState.teams[gameState.activeTeam].position;
    const totalCells = gameState.gameBoard.length;
    
    // Avance le joueur (en boucle si on dépasse la fin du plateau)
    let newPosition = (currentPosition + steps) % totalCells;
    
    // Met à jour la position de l'équipe active
    gameState.teams[gameState.activeTeam].position = newPosition;
    
    // Marque la case comme visitée
    gameState.gameBoard[newPosition].visited = true;
    
    // Définit cette case comme la carte active
    gameState.activeCard = gameState.gameBoard[newPosition].id;
    
    return updateGameState(gameState);
}

/**
 * Obtient la carte active selon la position du joueur
 */
function getActiveCardFromPosition() {
    const gameState = getGameState();
    const position = gameState.teams[gameState.activeTeam].position || 0;
    return gameState.gameBoard[position];
}

/**
 * Met à jour le temps restant
 */
function updateGameTime(secondsRemaining) {
    const gameState = getGameState();
    gameState.gameTime = secondsRemaining;
    return updateGameState(gameState);
}

/**
 * Démarrer le compte à rebours
 */
function startGameTimer() {
    const gameState = getGameState();
    if (!gameState.timerStarted) {
        gameState.timerStarted = true;
        updateGameState(gameState);
        
        // Met à jour le timer toutes les secondes
        const timerElement = document.getElementById('game-timer');
        
        if (window.gameTimerInterval) {
            clearInterval(window.gameTimerInterval);
        }
        
        window.gameTimerInterval = setInterval(() => {
            const currentState = getGameState();
            let remainingTime = currentState.gameTime - 1;
            
            if (remainingTime <= 0) {
                remainingTime = 0;
                clearInterval(window.gameTimerInterval);
                
                // Trouve l'équipe avec le score le plus élevé
                const teams = Object.values(currentState.teams).filter(team => team.active);
                const winningTeam = teams.reduce((prev, current) => 
                    (prev.score > current.score) ? prev : current
                );
                
                // Affiche l'écran de victoire
                showWinModal(winningTeam.score);
            }
            
            // Met à jour le timer
            updateGameTime(remainingTime);
            
            // Met à jour l'affichage
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (timerElement) {
                timerElement.textContent = timeString;
                
                // Ajoute des classes d'alerte selon le temps restant
                if (remainingTime <= 30) {
                    timerElement.classList.add('danger');
                    timerElement.classList.remove('warning');
                } else if (remainingTime <= 60) {
                    timerElement.classList.add('warning');
                    timerElement.classList.remove('danger');
                } else {
                    timerElement.classList.remove('warning', 'danger');
                }
            }
        }, 1000);
    }
}