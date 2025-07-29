/**
 * Fichier principal pour initialiser et gérer le jeu
 */

// Initialise le jeu au chargement de la page
document.addEventListener("DOMContentLoaded", function () {
    initGame();
    updateTeamsCorners(); // Affiche les coins dès le chargement

    const gameState = getGameState();
    const teamCards = document.querySelectorAll(".team-card");

    teamCards.forEach((teamCard) => {
        const teamId = teamCard.dataset.teamId;
        const playerInputs = teamCard.querySelectorAll(".player-input");
        const checkbox = teamCard.querySelector(
            '.toggle input[type="checkbox"]',
        );

        if (gameState.teams[teamId] && gameState.teams[teamId].active) {
            // Si l'équipe est active, remplir le premier champ avec une valeur par défaut
            if (playerInputs[0]) {
                playerInputs[0].value = `Joueur 1`;
            }
            // Cocher la checkbox si elle ne l'est pas déjà
            if (!checkbox.checked) {
                checkbox.checked = true;
            }
        }
    });
});
    let maleVoice = null;

    // Load voices properly
    function setVoices() {
    const voices = speechSynthesis.getVoices();
    maleVoice = voices.find(voice => voice.name === "Microsoft Paul - French (France)");

    if (!maleVoice) {
        console.warn("La voix 'Microsoft Paul' n'a pas été trouvée.");
    } else {
        console.log("Voix masculine trouvée :", maleVoice.name);
    }
}
    // Ensure voices are loaded
    window.speechSynthesis.onvoiceschanged = setVoices;
    setVoices();

function initGame() {
    // Initialise les gestionnaires d'événements
    setupEventListeners();

    // Vérifie s'il y a un état de jeu sauvegardé
    const gameState = getGameState();

    // Initialize le premier écran
    showScreen("welcome-screen");

    // voix de la bienvenue

      const voices = speechSynthesis.getVoices();
    maleVoice = voices.find(voice => voice.name === "Microsoft Paul - French (France)");

        let textToSpeak = 'Bienvenue dans votre jeu, La Bonne Gestion Immobilière.';
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

        utterance.lang = "fr-FR";
        utterance.pitch =10;
        if (maleVoice) {
            utterance.voice = maleVoice;
            
        }

                window.speechSynthesis.speak(utterance);
clapsSound()

    // Précharge les images depuis assets
    preloadAssets();
}

// Précharge les images pour une utilisation ultérieure
function preloadAssets() {
    const ASSETS_PATH = "assets/";
    const imagesToPreload = [
        // Add your actual image files here if needed
    ];

    imagesToPreload.forEach((imagePath) => {
        const img = new Image();
        img.src = ASSETS_PATH + imagePath;
    });
}

let dicelandBG;
let landSound;

function blamSoundEffect() {
    // Joue un son quand le dé s'arrête
    try {
        landSound = new Audio("../assets/blam.wav");
        landSound.volume = 0.5;

        landSound.play().catch((e) => console.log("Pas de son disponible"));
    } catch (e) {
        console.log("Audio non supporté");
    }
}

function clapsSound() {
    // Joue un son quand le dé s'arrête
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.3; // Définit le volume à 0.3

        const request = new XMLHttpRequest();
        request.open('GET', '../assets/claps.mp3', true);
        request.responseType = 'arraybuffer';

        request.onload = function() {
            const audioData = request.response;
            audioContext.decodeAudioData(audioData, function(buffer) {
                source.buffer = buffer;
                source.connect(gainNode); // Connecte la source au gain node
                gainNode.connect(audioContext.destination); // Connecte le gain node au contexte audio
                source.start(0);
                source.stop(audioContext.currentTime + 5); // Arrête le son après 5 secondes
            }, function(e) {
                console.log("Erreur de décodage audio: " + e.err);
            });
        };

        request.onerror = function() {
            console.log("Erreur de chargement du fichier audio");
        };

        request.send();
    } catch (e) {
        console.log("Audio non supporté");
    }
}


function setupEventListeners() {
    // Boutons de navigation entre les écrans
    document.getElementById("start-button").addEventListener("click", () => {
        // Ajoutez cela pour le bouton d'historique
        const historyButton = document.getElementById("show-history-button");
        if (historyButton) {
            historyButton.addEventListener("click", () => {
                console.log('Bouton "Voir Historique des Scores" cliqué !'); // Log pour vérifier si c'est appelé
                showScoreHistory(); // Appelle la fonction
            });
        } else {
            console.error(
                'Le bouton avec ID "show-history-button" n\'est pas trouvé dans le HTML !',
            );
        }
        // Efface complètement le localStorage pour repartir de zéro
        localStorage.clear();
        // Réinitialise l'état du jeu avec les scores à 0
        resetGameState();
        showScreen("team-setup-screen");

        if (dicelandBG) {
            dicelandBG.pause();
            dicelandBG.currentTime = 0; // Réinitialise le temps de lecture à 0
        }
        // Joue un son quand le dé s'arrête
        try {
            landSound = new Audio("../assets/bigenGame.wav");
            landSound.volume = 0.5;

            landSound.play().catch((e) => console.log("Pas de son disponible"));
        } catch (e) {
            console.log("Audio non supporté");
        }
        const rollButton = document.getElementById("roll-button");
        rollButton.style.display = "none";
    });

    document.getElementById("continue-button").addEventListener("click", () => {
        if (landSound) {
            landSound.pause();
            landSound.currentTime = 0; // Réinitialise le temps de lecture à 0
        }
        // Joue un son quand le dé s'arrête
        blamSoundEffect();

        // Réinitialise complètement l'état du jeu avec des scores à 0
        resetGameState();
        // Sauvegarde les informations des équipes avant de continuer
        saveTeamSetup();
        showScreen("dice-screen");
        updateTeamsDisplay();
    });

    document
        .getElementById("roll-dice-button")
        .addEventListener("click", () => {
            blamSoundEffect();
            // Joue un son quand le dé s'arrête
            dicelandBGSound();
            // Démarre le timer du jeu dès qu'on lance le dé la première fois
            showScreen("board-screen");
            startGameTimer();
            rollDice();
        });

    document.getElementById("roll-button").addEventListener("click", () => {
        blamSoundEffect();
        rollDice();

        const rollButton = document.getElementById("roll-button");
        rollButton.style.display = "none";
        const nextButton = document.getElementById("next-turn-button");
        nextButton.style.display = "block";
    });

    document
        .getElementById("next-turn-button")
        .addEventListener("click", () => {
            blamSoundEffect();
            nextTurn();
            const rollButton = document.getElementById("roll-button");
            rollButton.style.display = "block";
            const nextButton = document.getElementById("next-turn-button");
            nextButton.style.display = "none";
        });

    // document.getElementById('bonus-continue').addEventListener('click', () => {
    //     blamSoundEffect();
    //     console.log('clické');
    // });

    document.getElementById("exit-button").addEventListener("click", () => {
        blamSoundEffect();
        showExitModal();
    });

    document.getElementById("skip-video").addEventListener("click", () => {
        blamSoundEffect();
        // Arrête le timer de la vidéo
        if (window.videoTimer) {
            clearInterval(window.videoTimer);
        }
        toggleModal("video-modal", false);
    });

    document.getElementById("replay-button").addEventListener("click", () => {
        blamSoundEffect();
        // Efface complètement le localStorage
        localStorage.clear();

        // Réinitialise complètement l'état du jeu avec des scores à 0
        resetGameState();

        // Ferme la modale et nettoie les styles
        toggleModal("win-modal", false);
        document.body.classList.remove("win-celebration");

        // Revient à l'écran d'accueil
        showScreen("welcome-screen");

        // Réinitialise le timer
        if (window.gameTimerInterval) {
            clearInterval(window.gameTimerInterval);
        }

        // Réinitialise l'affichage du timer
        const timerElement = document.getElementById("game-timer");
        if (timerElement) {
            timerElement.textContent = "30:00";
            timerElement.classList.remove("warning", "danger");
        }

        console.log(
            "Jeu réinitialisé avec scores à 0, localStorage effacé complètement",
        );
    });

    document.getElementById("confirm-exit").addEventListener("click", () => {
        blamSoundEffect();

        // Ferme la modale
        toggleModal("exit-modal", false);

        // Efface tous les données du localStorage
        localStorage.clear();

        // Réinitialise complètement l'état du jeu
        resetGameState();

        // Arrête le timer si actif
        if (window.gameTimerInterval) {
            clearInterval(window.gameTimerInterval);
        }

        location.reload();
        // Revient à l'écran d'accueil
        showScreen("welcome-screen");

        console.log("Jeu quitté, localStorage effacé");
    });

    document.getElementById("cancel-exit").addEventListener("click", () => {
        blamSoundEffect();
        toggleModal("exit-modal", false);
    });
}
function updateScoreBlocks(gameState) {
    const scoreBlocksContainer = document.getElementById("score-blocks");
    scoreBlocksContainer.innerHTML = ""; // Vide le conteneur avant de le remplir

    Object.keys(gameState.teams).forEach((teamId) => {
        const team = gameState.teams[teamId];
        if (team.active) {
            const teamScoreBlock = document.createElement("div");
            teamScoreBlock.className = `team-score-block team${teamId}`;
            teamScoreBlock.id = `team${teamId}-score-block`;
            teamScoreBlock.innerHTML = `
                <div>Équipe ${teamId}</div>
                <div class="score">0 K</div>
            `;
            scoreBlocksContainer.appendChild(teamScoreBlock);
        }
    });
}

// Exemple d'utilisation
const gameState = getGameState();
updateScoreBlocks(gameState);

// Sauvegarde les informations des équipes
function saveTeamSetup() {
    const gameState = getGameState();
    
    document.querySelectorAll(".team-card").forEach((card) => {
        const teamId = card.dataset.teamId;
        const playerInputs = card.querySelectorAll(".player-input");
        const players = Array.from(playerInputs)
            .map((input) => input.value.trim())
            .filter((name) => name !== "");
        
        const playersAsObjects = players.map((name, index) => ({
            name: name || `Joueur ${index + 1}`,  // Utiliser un nom par défaut si vide
            score: 0,  // Initialiser explicitement
            scoreHistory: [0],  // Initialiser l'historique
            turnHistory: []  // Initialiser l'historique des tours
        }));
        
        const isActive = card.querySelector('input[type="checkbox"]').checked;
        
        if (gameState.teams[teamId]) {
            gameState.teams[teamId].players = playersAsObjects;
            gameState.teams[teamId].active = isActive;
        }
    });
    
    const activeTeamIds = Object.keys(gameState.teams)
        .filter((id) => gameState.teams[id].active)
        .map(Number);
    
    if (activeTeamIds.length > 0) {
        gameState.activeTeam = activeTeamIds[0];
    }
    
    updateGameState(gameState);
    updateScoreBlocks(gameState);
}
function dicelandBGSound() {
    try {
        const dicelandBG = new Audio("../assets/dicelandBG.wav");
        dicelandBG.volume = 0.5;
        dicelandBG.onended = function () {
            this.play().catch((e) => console.log("Pas de son disponible"));
        };
        dicelandBG.play().catch((e) => console.log("Pas de son disponible"));
    } catch (e) {
        console.log("Audio non supporté");
    }
}
// Gère le lancement du dé
function rollDice() {
    // Désactive le bouton pendant l'animation
    const rollButton = document.getElementById("roll-button");
    if (rollButton) rollButton.disabled = true;

    // Affiche le dé en plein écran
    const diceOverlay = document.getElementById("dice-fullscreen-overlay");
    const fullscreenDice = document.getElementById("fullscreen-dice");

    // Affiche l'overlay
    diceOverlay.classList.add("show");

    // Anime le dé avec des rotations dynamiques
    fullscreenDice.classList.add("rolling");

    // Ajouter un effet de tremblement au dé
    if (fullscreenDice.parentElement) {
        fullscreenDice.parentElement.classList.add("shake");
    }

    // Ajouter un son de dé qui roule
    try {
        const rollSound = new Audio("../assets/diceland.wav");
        rollSound.volume = 0.5;
        rollSound.play().catch((e) => console.log("Pas de son disponible"));
    } catch (e) {
        console.log("Audio non supporté");
    }

    // Prolonger la durée de l'animation pour mieux voir le dé tourner
    setTimeout(() => {
        // Génère un nombre aléatoire entre 1 et 6
        const diceValue = getRandomInt(1, 6);

        // Arrête l'animation du dé
        fullscreenDice.classList.remove("rolling");
        if (fullscreenDice.parentElement) {
            fullscreenDice.parentElement.classList.remove("shake");
        }

        // Met à jour l'affichage du dé en plein écran
        fullscreenDice.setAttribute("data-value", diceValue);

        // Met à jour aussi le dé normal (pour la cohérence)
        const normalDice = document.getElementById("dice");
        if (normalDice) {
            normalDice.setAttribute("data-value", diceValue);
        }

        // Met à jour l'état du jeu
        updateDiceValue(diceValue);
        updateDiceDisplay(diceValue);

        // Après un délai pour montrer le résultat, cache l'overlay
        setTimeout(() => {
            // Cache l'overlay du dé
            diceOverlay.classList.remove("show");
            // Joue un son quand le dé s'arrête
            try {
                landSound = new Audio("../assets/trn.wav");
                landSound.volume = 0.5;

                landSound
                    .play()
                    .catch((e) => console.log("Pas de son disponible"));
            } catch (e) {
                console.log("Audio non supporté");
            }
            // Si nous sommes sur l'écran de lancement du dé, passe au plateau de jeu
            if (
                document
                    .getElementById("dice-screen")
                    .classList.contains("active-screen")
            ) {
                showScreen("board-screen");
                renderGameBoard();
                updateTeamsDisplay();
            } else {
                // Si nous sommes déjà sur le plateau, déplace le joueur du nombre de cases indiqué par le dé
                // Déplace le joueur du nombre de cases indiqué par le dé
                const updatedState = movePlayer(diceValue);

                // Récupère la carte sur laquelle le joueur est arrivé
                const activeCard = getActiveCardFromPosition();

                // Met à jour l'affichage du plateau
                renderGameBoard();

                // Applique l'effet de la carte
                handleCellClick(activeCard.id, activeCard.type);

                // Réactive le bouton
                if (rollButton) rollButton.disabled = false;
            }
        }, 1500);
    }, 2500); // Augmenté à 2.5 secondes pour voir le dé qui tourne plus longtemps
}

// Passe au tour suivant
function nextTurn() {
    const gameState = advanceTurn();
    updateTeamsDisplay();
    updatePlayerList(); // Update the player list display
    updateTeamsCorners(); // Met à jour l'affichage des coins
    // **Ajout pour l'historique des tours**
    const activeTeam = gameState.teams[gameState.activeTeam];
    const currentPlayer = activeTeam.players[activeTeam.currentPlayer];
    if (currentPlayer) {
        updatePlayerTurn(
            currentPlayer,
            `Fin du tour: Passage au joueur suivant`,
        );
    }
    // Réactive le bouton de lancer de dé
    const rollButton = document.getElementById("roll-button");
    if (rollButton) rollButton.disabled = false;

    // Vérifier si une équipe a atteint le score de victoire (2000 points)
    const winningTeam = Object.values(gameState.teams).find(
        (team) => team.active && team.score >= 2000,
    );

    if (winningTeam) {
        showWinModal(winningTeam.score, winningTeam.name);
    }

    // Vérifier si le temps restant est inférieur à 30 secondes
    if (gameState.gameTime <= 30) {
        // Ajouter une alerte visuelle
        const timerElement = document.getElementById("game-timer");
        if (timerElement) {
            timerElement.classList.add("danger");
        }
    }
}

// Gère le clic sur une cellule du plateau
function handleCellClick(cellId, cellType) {
    const gameState = getGameState();
    setActiveCard(cellId);

    switch (cellType) {
        case CARD_TYPES.BONUS:
            handleBonusCard();
            break;
        case CARD_TYPES.FACTURE:
            handleFactureCard();
            break;
        case CARD_TYPES.INTERACTION:
            handleInteractionCard();
            break;
        case CARD_TYPES.BIENS:
            handleBiensCard();
            break;
        case CARD_TYPES.PDB:
            handlePDBCard();
            break;
        case CARD_TYPES.REDEVANCE:
            handleRedevanceCard();
            break;
    }
}
/**
 * Gère l'affichage et le traitement des cartes Redevance
 */
function handleRedevanceCard() {
    const redevanceCard = getRandomCard("redevance");
    const amount = redevanceCard.amount || getRandomInt(10, 40);  

    document.getElementById("redevance-text").textContent = "Redevance annuelle";
    document.getElementById("redevance-amount").textContent = `+${amount} K`;
    document.getElementById("redevance-amount").classList.remove("danger-amount");
    
    const descriptionElement = document.getElementById("redevance-description");
    if (descriptionElement) {
        descriptionElement.textContent = redevanceCard.description || "";
        descriptionElement.style.display = redevanceCard.description 
        ? "block"
        : "none";
    }
    
    showFlipCardModal("redevance", redevanceCard); 
    
    document.getElementById("redevance-continue").onclick = () => {
        closeFlipCardModal("redevance-modal");
        
        const gameState = getGameState();
        console.log(`Updating redevance card: Adding ${amount} to team ${gameState.activeTeam}`);
        
        debugTeamScores();  // Log avant mise à jour
        
        updateTeamScore(gameState.activeTeam, amount);  // Utilisez la fonction corrigée
        
        const activeTeam = gameState.teams[gameState.activeTeam];
        const currentPlayer = activeTeam.players[activeTeam.currentPlayer];
        if (currentPlayer) {
            updatePlayerTurn(currentPlayer, `Tour: +${amount} K pour Redevance annuelle`);
        }
        
        debugTeamScores();  // Log après mise à jour
        updateTeamsDisplay();
    };
}
// Gestion des cartes selon leur type
        updateTeamsDisplay();

        // Log after update to verify
        console.log("After property card update:");
        debugTeamScores();
    


function handleBonusCard() {
    // Utilise les données des cartes bonus
    const bonusCard = getRandomCard("bonus");

    // Affiche le titre de la carte
    document.getElementById("bonus-text").textContent = bonusCard.title;

    // Gestion des effets spéciaux ou des montants
    if (bonusCard.type === "special") {
        // Pour les cartes à effets spéciaux
        let effectText = "";

        switch (bonusCard.effect) {
            case "increase":
                effectText = `+${bonusCard.amount}% sur votre prochaine transaction`;
                break;
            case "no_rent":
                effectText = "Pas de loyer au prochain tour";
                break;
            default:
                effectText = "Effet spécial";
        }

        document.getElementById("bonus-amount").textContent = effectText;
    } else {
        // Pour les cartes avec un montant
        const amount = bonusCard.amount || 0;
        document.getElementById("bonus-amount").textContent = `${amount} K`;
    }

    // Toujours positif pour un bonus
    document.getElementById("bonus-amount").classList.remove("danger-amount");

    // Affiche la description si disponible
    const descriptionElement = document.getElementById("bonus-description");
    if (descriptionElement) {
        descriptionElement.textContent = bonusCard.description || "";
        descriptionElement.style.display = bonusCard.description
            ? "block"
            : "none";
    }

    // Affiche la carte bonus avec l'animation de retournement
showFlipCardModal("bonus", bonusCard); 
    // Quand l'utilisateur clique sur continuer, ferme la modale et applique l'effet
    document.getElementById("bonus-continue").onclick = () => {
        closeFlipCardModal("bonus-modal");

        const gameState = getGameState();

        // Applique l'effet selon le type de carte
        if (bonusCard.type === "special") {
            // Sauvegarde l'effet spécial pour l'équipe active
            const teamState = gameState.teams[gameState.activeTeam];
            if (!teamState.effects) teamState.effects = [];

            teamState.effects.push({
                type: bonusCard.effect,
                value: bonusCard.amount,
                applied: false,
            });

            updateGameState(gameState);
        } else if (bonusCard.amount) {
            // Applique le montant au score
            console.log(
                `Updating bonus card: Adding ${bonusCard.amount} to team ${gameState.activeTeam}`,
            );

            // Log before update
            debugTeamScores();

            updateTeamScore(gameState.activeTeam, bonusCard.amount);

            // **Ajout pour l'historique des tours**
            const activeTeam = gameState.teams[gameState.activeTeam];
            const currentPlayer = activeTeam.players[activeTeam.currentPlayer];
            if (currentPlayer) {
               updatePlayerTurn(currentPlayer, {
    description: `Tour: +${bonusCard.amount} K pour bonus`,
    cardTitle: bonusCard.title,
    amount: bonusCard.amount,
    effect: bonusCard.effect || "Aucun effet",
    type: bonusCard.type || "bonus"
});
            }
            // Log after update to verify
            console.log("After bonus card update:");
            debugTeamScores();
        }

        updateTeamsDisplay();
    };
}

function handleFactureCard() {
    // Utilise les données des cartes de facturation
    const factureCard = getRandomCard("facture");
    const amount = factureCard.amount || getRandomInt(10, 50); // Utilise un montant par défaut si nécessaire

    // Met à jour le texte et le montant dans la modale
    document.getElementById("facture-text").textContent = factureCard.title;
    document.getElementById("facture-amount").textContent = `${amount} K`;

    // Si il y a une description, l'afficher
    const descriptionElement = document.getElementById("facture-description");
    if (descriptionElement) {
        descriptionElement.textContent = factureCard.description || "";
        descriptionElement.style.display = factureCard.description
            ? "block"
            : "none";
    }

    // Affiche la carte facture avec l'animation de retournement
    showFlipCardModal("facture", factureCard);

    // Quand l'utilisateur clique sur payer, ferme la modale et met à jour le score
    document.getElementById("facture-continue").onclick = () => {
        closeFlipCardModal("facture-modal");

        // Retire le montant du score de l'équipe
        const gameState = getGameState();
                    const currentPlayer = activeTeam.players[activeTeam.currentPlayer];

updatePlayerTurn(currentPlayer, {
    description: `Tour: ${amount} K pour Facture`,
    cardTitle: factureCard.title,
    amount: amount,
    effect: factureCard.effect || "Aucun effet",
    type: factureCard.type || "facture"
});        updateTeamsDisplay();
    };
}

/**
 * Gère l'affichage et le traitement des cartes Biens
 */
function handleBiensCard() {
    // Utilise les données des cartes biens
    const biensCard = getRandomCard("biens");
    const amount = biensCard.amount || getRandomInt(10, 50);
    // Met à jour le texte dans la modale
    document.getElementById("biens-text").textContent = biensCard.title;
    document.getElementById("biens-amount").textContent =
        `+${biensCard.amount} K`;

    // Affiche la description si disponible
    const descriptionElement = document.getElementById("biens-description");
    if (descriptionElement) {
        descriptionElement.textContent = biensCard.description || "";
        descriptionElement.style.display = biensCard.description
            ? "block"
            : "none";
    }

    // Affiche la carte biens avec l'animation de retournement
    showFlipCardModal("biens", biensCard );

    // Quand l'utilisateur clique sur encaisser, ferme la modale et met à jour le score
    document.getElementById("biens-continue").onclick = () => {
        closeFlipCardModal("biens-modal" );

        // Ajoute la valeur du bien au score de l'équipe
        const gameState = getGameState();

        console.log(
            `Updating biens card: Adding ${biensCard.amount} to team ${gameState.activeTeam}`,
        );

        // Log before update
        debugTeamScores();

        updateTeamScore(gameState.activeTeam, biensCard.value);

        // Log after update to verify
        console.log("After biens card update:");
        debugTeamScores();
        // **Ajout pour l'historique des tours**
        const activeTeam = gameState.teams[gameState.activeTeam];
        const currentPlayer = activeTeam.players[activeTeam.currentPlayer];
        if (currentPlayer) {
           updatePlayerTurn(currentPlayer, {
    description: `Tour: ${biensCard.amount} K pour Bien`,
    cardTitle: biensCard.title,
    amount: biensCard.amount,
    effect: biensCard.effect || "Aucun effet",
    type: biensCard.type || "biens"
});
        }
        // Ajoute le bien à la liste des biens de l'équipe
        if (!gameState.teams[gameState.activeTeam].properties) {
            gameState.teams[gameState.activeTeam].properties = [];
        }

        gameState.teams[gameState.activeTeam].properties.push({
            id: biensCard.id,
            title: biensCard.title,
            description: biensCard.description,
            amount: biensCard.amount,
        });

        updateGameState(gameState);
    };
}

function handleInteractionCard() {
    // Utilise les données des cartes d'interaction
    const interactionCard = getRandomCard("interaction");
    const amount = interactionCard.amount || getRandomInt(10, 50);
    // Configurer le contenu du modal de la carte d'interaction
    document.getElementById("interaction-title").textContent =
        interactionCard.title || "Interaction";
    document.getElementById("interaction-description").textContent =
        interactionCard.description || "";

    // Afficher le modal sous forme de carte qui se retourne
    showFlipCardModal("interaction", interactionCard);

    // Variable pour stocker la carte pour utilisation après le flip
    const gameState = getGameState();
    gameState.currentInteractionCard = interactionCard;
    updateGameState(gameState);
    // Configuration du bouton "Passer" pour l'interaction (utilisation du bouton existant)
    document.getElementById("interaction-skip").onclick = () => {
        closeFlipCardModal("interaction-modal");

        // Affiche d'abord la vidéo si nécessaire
        showVideoModal("00:15");

        // Après la vidéo, traite la carte d'interaction
        document.getElementById("skip-video").onclick = () => {
            toggleModal("video-modal", false);

            // Récupère la carte d'interaction actuelle
            const currentState = getGameState();
            const card = currentState.currentInteractionCard;

            // Si c'est une carte qui affecte une autre équipe
            if (card.type === "team_effect") {
                // Réinitialise le sélecteur d'équipes
                const interactionTeamsContainer =
                    document.getElementById("interaction-teams");
                interactionTeamsContainer.innerHTML = "";

                // Récupère la liste des équipes actives autres que celle qui joue
                const activeTeams = Object.entries(currentState.teams).filter(
                    ([id, team]) =>
                        team.active && parseInt(id) !== currentState.activeTeam,
                );

                // S'il y a d'autres équipes actives, affiche les options
                if (activeTeams.length > 0) {
                    activeTeams.forEach(([id, team]) => {
                        const teamOption = document.createElement("div");
                        teamOption.className = `team-option team${id}-bg`;
                        teamOption.textContent = team.name;
                        teamOption.dataset.teamId = id;
                        teamOption.dataset.effect = card.effect;
                        teamOption.dataset.value = card.amount;
                        teamOption.onclick = () =>
                            handleTeamInteraction(
                                parseInt(id),
                                card.effect,
                                card.amount,
                            );
                        interactionTeamsContainer.appendChild(teamOption);
                    });

                    // Affiche la modale de sélection d'équipe
                    toggleModal("team-selection-modal", true);

                    // Option pour passer
                    document.getElementById("interaction-skip").onclick =
                        () => {
                            toggleModal("team-selection-modal", false);

                            // Bonus par défaut si la carte a un montant
                            if (card.amount) {
                                console.log(
                                    `Updating interaction skip: Adding ${card.amount} to team ${currentState.activeTeam}`,
                                );

                                // Log before update
                                debugTeamScores();

                                updateTeamScore(
                                    currentState.activeTeam,
                                    card.amount,
                                );
                                // **Ajout pour l'historique des tours**
                                const activeTeam =
                                    gameState.teams[gameState.activeTeam];
                                const currentPlayer =
                                    activeTeam.players[
                                        activeTeam.currentPlayer
                                    ];
                                if (currentPlayer) {
                                    updatePlayerTurn(
                                        currentPlayer,
                                        `Tour: -${amount} K pour Interaction ${interactionCard.title}`,
                                    );
                                }
                                // Log after update to verify
                                console.log("After interaction skip update:");
                                debugTeamScores();
                            } else {
                                // Bonus par défaut si pas de montant spécifié
                                const defaultBonus = 50;

                                console.log(
                                    `Updating interaction skip: Adding default ${defaultBonus} to team ${currentState.activeTeam}`,
                                );

                                // Log before update
                                debugTeamScores();

                                updateTeamScore(
                                    currentState.activeTeam,
                                    defaultBonus,
                                );

                                // Log after update to verify
                                console.log("After interaction skip update:");
                                debugTeamScores();
                            }

                            updateTeamsDisplay();
                        };
                } else {
                    // S'il n'y a pas d'autres équipes actives, donne un bonus direct

                    const amount = card.amount || getRandomInt(1, 3) * 50;

                    // Met à jour le texte et le montant dans la modale bonus
                    document.getElementById("bonus-text").textContent =
                        card.title || "Bonus";
                    document.getElementById("bonus-amount").textContent =
                        `+${amount} K`;
                    document
                        .getElementById("bonus-amount")
                        .classList.remove("danger-amount");

                    // Affiche la description si disponible
                    const bonusDescElement =
                        document.getElementById("bonus-description");
                    if (bonusDescElement) {
                        bonusDescElement.textContent = card.description || "";
                        bonusDescElement.style.display = card.description
                            ? "block"
                            : "none";
                    }

                    // Affiche la modale bonus avec l'animation de retournement
                    showFlipCardModal("bonus", card);

                    // Quand l'utilisateur clique sur continuer, ferme la modale et met à jour le score
                    document.getElementById("bonus-continue").onclick = () => {
                        closeFlipCardModal("bonus-modal");

                        // Ajoute le montant au score de l'équipe
                        updateTeamScore(currentState.activeTeam, amount);
                        updateTeamsDisplay();
                    };
                }
            } else {
                // Si c'est une carte qui affecte directement l'équipe courante
                const amount = card.amount || getRandomInt(1, 3) * 25;

                // Met à jour le texte et le montant dans la modale bonus
                document.getElementById("bonus-text").textContent =
                    card.title || "Bonus";
                document.getElementById("bonus-amount").textContent =
                    `+${amount} K`;

                // Affiche la description si disponible
                const bonusDescElement =
                    document.getElementById("bonus-description");
                if (bonusDescElement) {
                    bonusDescElement.textContent = card.description || "";
                    bonusDescElement.style.display = card.description
                        ? "block"
                        : "none";
                }

                // Affiche la modale bonus avec l'animation de retournement
                showFlipCardModal("bonus", card);

                // Quand l'utilisateur clique sur continuer, ferme la modale et met à jour le score
                document.getElementById("bonus-continue").onclick = () => {
                    closeFlipCardModal("bonus-modal");

                    // Ajoute le montant au score de l'équipe
                    updateTeamScore(currentState.activeTeam, amount);
                    updateTeamsDisplay();
                };
            }
        };
    };
}

/**
 * Gère l'affichage et le traitement des cartes PDB (Pas de Bol)
 */
function handlePDBCard() {
    // Utilise les données des cartes PDB
    const pdbCard = getRandomCard("pdb");
    const amount = pdbCard.amount || getRandomInt(10, 50); // Utilise un montant par défaut si nécessaire

    // Met à jour le texte et le montant dans la modale
    document.getElementById("pdb-text").textContent = pdbCard.title;
    document.getElementById("pdb-amount").textContent = `${amount} K`;

    // Affiche la description si disponible
    const descriptionElement = document.getElementById("pdb-description");
    if (descriptionElement) {
        descriptionElement.textContent = pdbCard.description || "";
        descriptionElement.style.display = pdbCard.description
            ? "block"
            : "none";
    }

    // Affiche la carte PDB avec l'animation de retournement
    showFlipCardModal("pdb", pdbCard );

    // Quand l'utilisateur clique sur payer, ferme la modale et applique l'effet
    document.getElementById("pdb-continue").onclick = () => {
        closeFlipCardModal("pdb-modal");

        const gameState = getGameState();

        // Applique l'effet selon le type de carte
        if (pdbCard.type === "special") {
            // Sauvegarde l'effet spécial pour l'équipe active
            const teamState = gameState.teams[gameState.activeTeam];
            if (!teamState.effects) teamState.effects = [];

            teamState.effects.push({
                type: pdbCard.effect,
                value: pdbCard.value,
                applied: false,
            });

            updateTeamScore(gameState.activeTeam, amount);
            // **Ajout pour l'historique des tours**
            const activeTeam = gameState.teams[gameState.activeTeam];
            const currentPlayer = activeTeam.players[activeTeam.currentPlayer];
        if (currentPlayer) {
                updatePlayerTurn(currentPlayer, {
            description: `Tour: ${amount} K pour PDB`,
            cardTitle: pdbCard.title,
            amount: amount,
            effect: pdbCard.effect || "Aucun effet",
            type: pdbCard.type || "pdb"
             });
            }
            console.log(
                `Applied special effect: ${pdbCard.effect} with value ${pdbCard.value} to team ${gameState.activeTeam}`,
            );
        } else {
            // Retire le montant du score de l'équipe (toujours négatif pour PDB)
            console.log(
                `Updating PDB card: Removing ${amount} from team ${gameState.activeTeam}`,
            );

            // Log before update
            debugTeamScores();

            updateTeamScore(gameState.activeTeam, amount);

            // Log after update to verify
            console.log("After PDB card update:");
            debugTeamScores();
        }

        updateTeamsDisplay();
    };
}
function showNotification(message) {
    // Crée un élément de notification
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;

    // Ajoute la notification au corps du document
    document.body.appendChild(notification);

    // Supprime la notification après quelques secondes
    setTimeout(() => {
        notification.remove();
    }, 3000); // Supprime après 3 secondes
}
// Gère l'interaction entre deux équipes
function handleTeamInteraction(targetTeamId, effect, value) {
    const gameState = getGameState();
    const activeTeamId = gameState.activeTeam;

    // Ferme la modale d'interaction
    toggleModal("interaction-modal", false);

    // Traite l'effet selon son type
    if (effect === "team_increase" || effect === "team_reduction") {
        // Ajoute un effet à l'équipe cible
        if (!gameState.teams[targetTeamId].effects) {
            gameState.teams[targetTeamId].effects = [];
        }

        gameState.teams[targetTeamId].effects.push({
            type: effect,
            value: value,
            applied: false,
            source: activeTeamId, // L'équipe qui a appliqué cet effet
        });

        updateGameState(gameState);

        // Affiche un message pour confirmer l'action
        const targetTeamName = gameState.teams[targetTeamId].name;
        const effectText =
            effect === "team_increase"
                ? `augmenter de ${value}%`
                : `réduire de ${value}%`;

        showNotification(
            `La prochaine facture de ${targetTeamName} va ${effectText}.`,
        );
    } else {
        // Comportement par défaut : transfert d'argent
        const amount = value || 100; // Montant par défaut si non spécifié

        console.log(
            `Team interaction: Transferring ${amount} from team ${targetTeamId} to team ${activeTeamId}`,
        );

        // Log before update
        debugTeamScores();

        // Transfère de l'équipe cible vers l'équipe active
        updateTeamScore(activeTeamId, amount);
        updateTeamScore(targetTeamId, amount);

        // Log after update to verify
        console.log("After team interaction update:");
        debugTeamScores();

        console.log(
            `Score updated: Active team ${activeTeamId}: +${amount}, Target team ${targetTeamId}: -${amount}`,
        );
    }

    // Met à jour l'affichage des équipes après les modifications de score
    updateTeamsDisplay();
}

// Fonction pour déboguer les scores des équipes
function debugTeamScores() {
    const gameState = getGameState();
    console.log("=== CURRENT TEAM SCORES ===");

    Object.entries(gameState.teams).forEach(([teamId, team]) => {
        if (team.active) {
            console.log(`Team ${teamId} (${team.name}): Score = ${team.score}`);
        }
    });

    console.log("==========================");
}

// Appel automatique au démarrage pour vérifier l'état initial
document.addEventListener("DOMContentLoaded", function () {
    // Ajout d'un délai pour s'assurer que le jeu soit initialisé
    setTimeout(debugTeamScores, 1000);
});
