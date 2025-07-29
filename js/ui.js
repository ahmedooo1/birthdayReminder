/**
 * Gestion de l'interface utilisateur
 */

// Fonctions pour manipuler les écrans
function showScreen(screenId) {
    // Cache tous les écrans
    document.querySelectorAll(".screen").forEach((screen) => {
        screen.classList.remove("active-screen");
    });

    // Affiche l'écran demandé
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add("active-screen");
    }
}

// Affiche ou cache les modalités
function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (modal) {
        if (show) {
            modal.classList.add("show");
        } else {
            modal.classList.remove("show");
        }
    }
}


function showScoreHistory() {
    console.log("Exécution de showScoreHistory..."); // Log existant
    const gameState = getGameState();

    if (!gameState || !gameState.teams) {
        console.error(
            "Erreur : gameState ou teams est undefined. Vérifiez les données du jeu.",
        );
        return; // Arrêter si les données ne sont pas valides
    }

    let historyHTML = "<h3>Historique des Tours et Scores</h3>";

    let hasData = false; // Variable pour vérifier s'il y a des données

    Object.keys(gameState.teams).forEach((teamId) => {
        if (gameState.teams[teamId].active && gameState.teams[teamId].players) {
            gameState.teams[teamId].players.forEach((player, index) => {
                const scoreHistory = player.scoreHistory || [0]; // Scores existants
                const turnHistory = player.turnHistory || []; // Historique des tours

                if (scoreHistory.length > 0) {
                    hasData = true;
                    historyHTML += `<div class="history-item">
                        <h4>Équipe ${teamId} - Joueur ${index + 1} (${player.name || "Inconnu"})</h4>
                        <div class="score-details">`;

                    scoreHistory.forEach((score, i) => {
                        const turnDetail = turnHistory[i] ? turnHistory[i].description : "=========";
                        const cardData = turnHistory[i] || {};  // Objet complet de la carte
                        const cardTitle = cardData.cardTitle || "Titre inconnu";
                        const cardDescription = cardData.description || "Aucune description";
                        const cardAmount = cardData.amount ? `${cardData.amount} K` : "Montant non spécifié";
                        const cardMinAmount = cardData.minAmount ? `Min: ${cardData.minAmount} K` : "";
                        const cardMaxAmount = cardData.maxAmount ? `Max: ${cardData.maxAmount} K` : "";
                        const cardEffect = cardData.effect ? `Effet: ${cardData.effect}` : "Aucun effet";

                        let changeDetail = ""; // Détail du changement
                        if (i > 0) {
                            const previousScore = scoreHistory[i - 1];
                            const change = score - previousScore; // Calcul de la différence
                            const changeSign = change >= 0 ? "+" : ""; // Ajoute + pour positif
                            changeDetail = `<p>Changement : ${changeSign}${change} (Score précédent: ${previousScore}, Score actuel: ${score})</p>`;
                        }

                        historyHTML += `<div class="tour">
                            <p><strong>Tour ${i + 1}:</strong> Score = ${score}</p>
                            ${changeDetail}
                            <p><strong>Détails de la carte:</strong></p>
                            <ul>
                                <li>Titre: ${cardTitle}</li>
                                <li>Description: ${cardDescription}</li>
                                <li>Montant: ${cardAmount}</li>
                                <li>${cardMinAmount}</li>
                                <li>${cardMaxAmount}</li>
                                <li>${cardEffect}</li>
                            </ul>
                            <p><strong>Détails du tour:</strong> ${turnDetail}</p>
                        </div>`;
                    });

                    historyHTML += `</div></div>`;
                }
            });
        }
    });

    if (!hasData) {
        historyHTML +=
            "<p>Aucun historique de scores ou de tours disponible. Jouez une partie pour générer des données !</p>";
    }

    const modal = document.createElement("div");
    modal.innerHTML = historyHTML;
    modal.className = "history-modal";

    const closeBtn = document.createElement("button");
    closeBtn.innerText = "Fermer";
    closeBtn.className = "close-btn";
    closeBtn.addEventListener("click", () => document.body.removeChild(modal));
    modal.appendChild(closeBtn);

    document.body.appendChild(modal);
}

// Met à jour l'affichage des équipes et des scores
function updateTeamsDisplay() {
    const gameState = getGameState();

    // Met à jour les informations du tour
    document.getElementById("turn-counter").textContent = gameState.currentTurn;
    document.getElementById("active-team-name").textContent =
        gameState.teams[gameState.activeTeam].name;

    console.log("Updating team displays with current scores:");

    // Met à jour les blocs de score
    Object.keys(gameState.teams).forEach((teamId) => {
        const team = gameState.teams[teamId];
        if (!team.active) return;

        console.log(`Team ${teamId} (${team.name}): Score = ${team.score}`);

        const scoreBlock = document.getElementById(`team${teamId}-score-block`);
        if (scoreBlock) {
            const scoreElement = scoreBlock.querySelector(".score");

            // Affiche '+' pour les scores positifs, '-' pour les négatifs
            const scorePrefix = team.score >= 0 ? "" : "-";
            const scoreAbsValue = Math.abs(team.score);

            if (scoreElement) {
                scoreElement.textContent = `${scorePrefix}${scoreAbsValue} K`;
                console.log(
                    `Updated score display for team ${teamId} to: ${scoreElement.textContent}`,
                );
            }

            // Mise à jour du nom de l'équipe
            const teamNameDiv = scoreBlock.querySelector("div:first-child");
            if (teamNameDiv) {
                teamNameDiv.textContent = team.name;
            }
        } else {
            console.warn(`Score block for team ${teamId} not found in DOM`);
        }
    });

    // Met à jour les informations du joueur actif
    updateCurrentPlayerInfo();
}


// Crée dynamiquement le plateau de jeu
function renderGameBoard() {
    const gameState = getGameState();
    const boardElement = document.querySelector(".game-board");

    if (!boardElement) return;

    // Vide le plateau
    boardElement.innerHTML = "";

    // Crée une grille 6x6 pour positionner les cellules selon leur ordre spiral
    const grid = Array(6)
        .fill()
        .map(() => Array(6).fill(null));

    // Place chaque cellule à sa position dans la grille selon l'ordre spiral
    gameState.gameBoard.forEach((cell) => {
        if (cell.gridPosition) {
            grid[cell.gridPosition.row][cell.gridPosition.col] = cell;
        }
    });

    // Crée les cellules dans l'ordre de la grille pour l'affichage
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 6; col++) {
            const cell = grid[row][col];
            if (!cell) continue;

            const cellElement = document.createElement("div");
            cellElement.className = `board-cell ${cell.type}`;
            cellElement.dataset.id = cell.id;
            cellElement.dataset.type = cell.type;
            cellElement.style.gridRow = row + 1;
            cellElement.style.gridColumn = col + 1;

            // Ajoute un effet de surbrillance pour la case où se trouve le joueur actif
            Object.keys(gameState.teams).forEach((teamId) => {
                const team = gameState.teams[teamId];
                if (team.active && team.position === cell.id) {
                    cellElement.classList.add("active-player");
                    cellElement.setAttribute("data-team", teamId);

                    // Ajoute un indicateur de joueur
                    const playerIndicator = document.createElement("div");
                    playerIndicator.className = `player-indicator ${team.color}`;
                    cellElement.appendChild(playerIndicator);
                }
            });

            // Ajoute l'icône appropriée selon le type de cellule
            const iconElement = document.createElement("div");
            iconElement.className = "cell-icon";

            let iconSvg = "";

            switch (cell.type) {
                case CARD_TYPES.DEPART:
                    iconSvg = `<div><svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" inkscape:version="1.0 (4035a4f, 2020-05-01)" sodipodi:docname="Marianne.svg" viewBox="0 0 89.17067 32.426666" height="32.426666" width="89.17067" xml:space="preserve" id="svg10" version="1.1"><metadata id="metadata16"><rdf:RDF><cc:Work rdf:about=""><dc:format>image/svg+xml</dc:format><dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/><dc:title/></cc:Work></rdf:RDF></metadata><defs id="defs14"><clipPath id="clipPath28" clipPathUnits="userSpaceOnUse"><path id="path26" d="M 0,24.32 H 66.878 V 0 H 0 Z"/></clipPath></defs><sodipodi:namedview inkscape:current-layer="g18" inkscape:window-maximized="0" inkscape:window-y="23" inkscape:window-x="0" inkscape:cy="16.213333" inkscape:cx="44.585335" inkscape:zoom="7.9622594" showgrid="false" id="namedview12" inkscape:window-height="723" inkscape:window-width="1366" inkscape:pageshadow="2" inkscape:pageopacity="0" guidetolerance="10" gridtolerance="10" objecttolerance="10" borderopacity="1" bordercolor="#666666" pagecolor="#ffffff"/><g transform="matrix(1.3333333,0,0,-1.3333333,0,32.426667)" inkscape:label="Marianne" inkscape:groupmode="layer" id="g18"><path id="path20" style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" d="M 0,0 H 66.878 V 24.32 H 0 Z"/><g id="g22"><g clip-path="url(#clipPath28)" id="g24"><g transform="translate(19.6167,6.8952)" id="g30"><path id="path32" style="fill:#000091;fill-opacity:1;fill-rule:nonzero;stroke:none" d="M 0,0 C -0.046,0.046 0.138,0 0.184,0.092 H -0.184 C -0.23,0.092 -0.23,0.138 -0.23,0.185 -0.46,0.138 -0.735,0.046 -0.965,0 -1.287,-0.092 -1.562,-0.322 -1.93,-0.414 c -0.507,-0.183 -0.919,-0.597 -1.471,-0.781 -0.046,0 -0.046,0.047 -0.046,0.092 0.046,0.138 0.23,0.184 0.322,0.322 0,0.046 0,0.093 -0.046,0.093 0.368,0.504 0.873,0.78 1.333,1.194 v 0.138 c 0.138,0.183 0.367,0.275 0.459,0.505 0.046,0.138 0.23,0.321 0.46,0.413 -0.046,0.047 -0.138,0.047 -0.138,0.138 -0.184,0 -0.368,-0.091 -0.552,0.046 0.086,0.086 0.185,0.133 0.289,0.164 -0.04,0.008 -0.075,0.027 -0.105,0.067 -0.046,0.091 0.089,0.194 0.23,0.229 0.184,0.046 0.414,0.046 0.552,0.185 -0.322,0.046 -0.69,-0.093 -1.012,0.091 0.23,0.597 0.598,1.102 1.15,1.378 0.045,0 0.137,0 0.137,-0.046 0,-0.23 -0.137,-0.413 -0.367,-0.459 C -0.368,3.264 0,3.264 0.368,3.079 0.322,2.987 0.23,3.033 0.184,3.033 0.414,2.896 0.689,2.987 0.919,2.804 0.781,2.666 0.643,2.804 0.505,2.804 1.93,2.391 3.447,2.068 4.642,1.149 3.631,0.644 2.574,0.414 1.471,0.185 c -0.138,0 -0.23,0 -0.368,0.045 0,-0.045 0,-0.138 -0.046,-0.138 C 0.873,0.092 0.735,0.092 0.598,0 0.414,-0.092 0.138,-0.138 0,0 m -0.941,-3.197 c -0.004,-0.002 -0.008,-0.005 -0.012,-0.008 -0.172,-0.121 -0.343,-0.245 -0.524,-0.35 -0.197,-0.114 -0.402,-0.201 -0.607,-0.298 -10e-4,0.004 -0.003,0.008 -0.005,0.012 -0.016,0.021 -0.048,0.035 -0.078,0.018 -0.174,-0.094 -0.322,-0.218 -0.463,-0.352 -0.021,-0.02 -0.042,-0.041 -0.063,-0.062 -0.002,-0.001 -0.003,-0.002 -0.004,-0.003 -0.002,-10e-4 -0.003,-0.003 -0.004,-0.004 -0.022,-0.022 -0.043,-0.043 -0.065,-0.065 -0.004,-0.003 -0.005,-0.005 -0.008,-0.008 -10e-4,-10e-4 -10e-4,-0.002 -0.003,-0.004 -0.032,-0.032 -0.064,-0.065 -0.1,-0.107 -0.023,-0.027 -0.03,-0.044 -0.061,-0.065 -0.029,-0.019 -0.107,-0.018 -0.1,0.035 v 0.009 c -0.027,-0.015 -0.054,-0.029 -0.081,-0.042 -0.027,-0.012 -0.049,-0.026 -0.072,-0.04 -0.01,0.005 -0.021,0.006 -0.032,0.005 -0.012,0 -0.023,-0.003 -0.033,-0.011 -0.057,-0.044 -0.112,-0.091 -0.166,-0.14 C -3.519,-4.764 -3.608,-4.859 -3.689,-4.96 -3.69,-4.962 -3.691,-4.963 -3.693,-4.965 L -3.702,-4.977 C -3.707,-4.983 -3.711,-4.989 -3.716,-4.995 -3.72,-5.001 -3.725,-5.008 -3.73,-5.014 -3.732,-5.016 -3.733,-5.018 -3.734,-5.02 -3.745,-5.035 -3.755,-5.05 -3.766,-5.066 l -0.003,-0.002 c -0.006,-0.009 -0.019,-0.015 -0.036,-0.018 -0.007,0.009 -0.013,0.018 -0.019,0.027 -0.004,0.007 -0.009,0.015 -0.013,0.022 -0.013,0.024 -0.027,0.049 -0.039,0.074 l -10e-4,0.003 c -0.004,0.007 -0.007,0.015 -0.011,0.023 0.05,0.053 0.097,0.108 0.144,0.165 0.003,0.004 0.007,0.007 0.01,0.011 0.015,0.02 0.031,0.039 0.046,0.059 0.027,0.033 0.053,0.066 0.078,0.098 0.01,0.013 0.019,0.025 0.027,0.037 0.052,0.066 0.1,0.13 0.145,0.194 0,0.002 0.001,0.003 0.002,0.005 0.008,0.009 0.015,0.019 0.02,0.029 0.022,0.032 0.045,0.065 0.063,0.099 0.019,0.03 0.036,0.06 0.052,0.091 0.001,0.003 0.002,0.005 0.003,0.007 0.002,0.003 0.004,0.007 0.005,0.01 0.002,0.005 0.005,0.011 0.007,0.017 0.016,0.034 0.031,0.07 0.044,0.107 0.002,0.004 0.003,0.008 0.004,0.012 0.004,0.01 0.007,0.02 0.01,0.03 0.006,0.016 0.011,0.034 0.015,0.051 10e-4,0.003 0.002,0.007 0.003,0.011 0.005,0.022 0.011,0.044 0.016,0.067 0.002,0.013 -10e-4,0.022 -0.006,0.031 0.05,0.087 0.112,0.17 0.182,0.248 -0.007,-0.004 -0.014,-0.007 -0.021,-0.012 -0.066,-0.042 -0.109,-0.101 -0.17,-0.147 -0.05,-0.037 -0.144,0.025 -0.084,0.069 0.041,0.03 0.072,0.063 0.105,0.095 0.001,0.002 0.002,0.005 0.005,0.007 0.076,0.075 0.148,0.17 0.234,0.233 0.053,0.039 0.099,0.071 0.142,0.108 0.007,0.006 0.013,0.012 0.02,0.019 0.032,0.042 0.067,0.08 0.103,0.116 0.002,10e-4 0.003,0.003 0.005,0.004 0.439,0.425 1.18,0.406 1.76,0.676 0.23,0.092 0.505,-0.046 0.735,0 0.138,0 0.276,0 0.414,-0.091 -0.413,-0.226 -0.795,-0.479 -1.171,-0.716 m 0.824,-0.379 c -0.022,-0.051 -0.068,-0.094 -0.114,-0.135 0.058,-0.011 0.098,-0.037 0.061,-0.071 -0.107,-0.098 -0.208,-0.196 -0.349,-0.243 -0.009,-0.003 -0.037,-0.007 -0.07,-0.009 -0.057,-0.055 -0.113,-0.109 -0.172,-0.161 -0.054,-0.048 -0.307,-0.013 -0.23,0.055 0.117,0.103 0.225,0.216 0.34,0.321 0.065,0.059 0.134,0.116 0.191,0.183 0.032,0.037 0.059,0.073 0.099,0.102 0.038,0.026 0.281,0.048 0.244,-0.042 M -2.252,3.31 C -2.298,3.217 -2.349,3.207 -2.39,3.125 -2.437,3.033 -2.482,2.987 -2.574,2.941 c -0.045,0 -0.093,0 -0.093,0.046 0.048,0.184 0.185,0.368 0.369,0.414 0.046,0 0.046,-0.046 0.046,-0.091 M -6.066,0.276 c 0,0 -0.046,0.046 -0.046,0.092 0.597,0.781 1.057,1.516 1.469,2.343 0.599,0.322 1.095,0.791 1.564,1.287 0.781,0.827 1.608,1.563 2.574,2.022 C -0.138,6.158 0.322,6.112 0.689,5.974 0.551,5.79 0.322,5.837 0.138,5.698 0.092,5.698 0.046,5.698 0,5.745 0.046,5.79 0.046,5.837 0.046,5.882 -0.414,5.377 -1.057,5.147 -1.425,4.55 -1.7,4.09 -1.884,3.493 -2.482,3.355 -2.667,3.31 -2.437,3.493 -2.528,3.447 -3.952,2.574 -4.963,1.518 -6.066,0.276 m 7.031,-1.011 c -0.092,0 -0.276,-0.046 -0.23,0.047 0.046,0.229 0.368,0.229 0.552,0.32 0.092,0.046 0.229,0.139 0.321,0.093 C 1.7,-0.414 1.838,-0.368 1.93,-0.459 1.654,-0.735 1.287,-0.597 0.965,-0.735 m 7.067,-3.292 c 0.261,0.261 0.525,0.541 0.787,0.822 H 8.813 c 0.488,0.553 0.967,1.08 1.533,1.564 0.172,0.155 0.34,0.291 0.5,0.4 0.046,0.046 0.046,0.138 0.091,0.184 -0.229,-0.091 -0.367,-0.276 -0.597,-0.368 -0.046,0 -0.092,0.046 -0.046,0.092 0.164,0.123 0.327,0.246 0.491,0.369 -0.01,-0.001 -0.021,-0.001 -0.031,-0.001 -0.046,0 -0.046,0.046 -0.046,0.092 C 10.11,-0.781 9.651,-1.195 9.237,-1.562 9.145,-1.607 9.053,-1.516 9.008,-1.516 8.318,-1.746 7.813,-2.344 7.123,-2.62 v 0.092 C 6.847,-2.62 6.58,-2.786 6.296,-2.849 5.882,-2.94 5.515,-2.895 5.147,-2.895 4.59,-2.951 4.033,-3.074 3.476,-3.193 L 3.428,-3.205 C 3.129,-3.286 2.847,-3.398 2.572,-3.549 2.561,-3.556 2.55,-3.562 2.54,-3.568 2.517,-3.596 2.495,-3.624 2.474,-3.647 2.375,-3.756 2.29,-3.855 2.159,-3.922 1.876,-4.066 1.646,-4.316 1.396,-4.519 1.379,-4.534 1.351,-4.541 1.323,-4.543 1.076,-4.779 0.833,-5.019 0.583,-5.251 0.565,-5.268 0.494,-5.277 0.442,-5.268 c 0.002,10e-4 0.003,0.002 0.004,0.004 0.009,0.015 0.018,0.029 0.027,0.044 0.039,0.065 0.078,0.129 0.118,0.194 0.044,0.072 0.09,0.143 0.136,0.213 0.063,0.095 0.127,0.189 0.195,0.28 0.018,0.024 0.014,0.045 -0.001,0.06 -0.015,0.016 -0.039,0.025 -0.064,0.024 0.23,0.223 0.502,0.412 0.772,0.576 v 0.008 c -0.031,-0.011 -0.076,0.014 -0.052,0.046 0.029,0.041 0.052,0.084 0.079,0.125 0.005,0.014 0.01,0.027 0.015,0.041 C 1.659,-3.641 1.647,-3.629 1.636,-3.616 1.562,-3.665 1.483,-3.711 1.42,-3.768 1.31,-3.866 1.224,-4.069 1.057,-4.067 c -0.011,0 -0.043,0.002 -0.07,0.01 -0.02,0.003 -0.037,0.009 -0.048,0.016 0.002,0.004 0.004,0.007 0.006,0.011 l 0.007,0.013 c 0.002,0.003 0.004,0.007 0.006,0.011 0.008,0.013 0.015,0.027 0.022,0.04 0.008,0.013 0.015,0.026 0.022,0.039 0.006,0.011 0.012,0.022 0.018,0.032 0.011,0.02 0.021,0.039 0.032,0.059 0.008,0.014 0.017,0.027 0.024,0.041 0.02,0.034 0.04,0.068 0.06,0.101 0.009,0.017 0.018,0.033 0.028,0.049 0.017,0.028 0.032,0.056 0.049,0.084 0.023,0.038 -0.001,0.069 -0.035,0.082 0.086,0.11 0.19,0.203 0.315,0.274 H 1.48 c 0.175,0.089 0.351,0.196 0.527,0.295 0.026,0.022 0.05,0.044 0.076,0.066 -0.262,-0.088 -0.498,-0.207 -0.731,-0.361 0,0 -0.06,-0.025 -0.078,-0.042 0,0 -0.052,-0.019 -0.114,0.042 -0.006,0.009 -0.011,0.019 -0.011,0.034 0.046,0.092 0.184,0.138 0.276,0.231 0.046,0 0.091,0 0.091,-0.047 1.471,1.149 3.493,0.873 5.194,1.471 0.137,0.091 0.275,0.183 0.413,0.275 0.23,0.093 0.414,0.322 0.69,0.46 0.367,0.276 0.643,0.597 0.781,1.057 0,0.046 -0.046,0.092 -0.046,0.092 C 7.951,-0.275 7.261,-0.781 6.526,-1.148 5.561,-1.654 4.504,-1.562 3.493,-1.7 c 0.046,0.093 0.138,0.093 0.229,0.093 0,0.136 0.092,0.182 0.184,0.274 h 0.138 c 0.046,0 0.046,0.092 0.092,0.092 0.092,0 0.23,0.046 0.184,0.046 -0.138,0.184 -0.414,-0.138 -0.644,0 0.092,0.092 0.046,0.23 0.138,0.276 h 0.184 c 0,0.092 0.092,0.184 0.092,0.184 0.689,0.413 1.333,0.735 1.976,1.103 -0.138,0 -0.23,-0.138 -0.367,-0.046 0.091,0 0,0.138 0.091,0.138 0.506,0.138 0.92,0.413 1.425,0.597 -0.184,0 -0.322,-0.138 -0.505,0 0.092,0.047 0.137,0.138 0.275,0.138 v 0.138 c 0,0.046 0.046,0.046 0.092,0.046 -0.046,0 -0.092,0.046 -0.092,0.046 0.046,0.093 0.184,0.045 0.276,0.137 -0.046,0 -0.138,0 -0.138,0.047 0.138,0.183 0.368,0.229 0.598,0.275 -0.047,0.093 -0.184,0 -0.184,0.093 0,0.045 0.046,0.045 0.092,0.045 H 7.537 C 7.445,2.068 7.491,2.16 7.491,2.206 7.767,2.527 7.767,2.941 7.904,3.31 7.858,3.31 7.813,3.31 7.813,3.355 7.353,2.85 6.618,2.666 5.928,2.482 H 5.699 C 5.469,2.391 5.147,2.391 4.917,2.527 4.733,2.619 4.642,2.757 4.458,2.896 4.09,3.125 3.722,3.31 3.309,3.447 2.16,3.814 0.965,3.998 -0.23,3.952 c 0.506,0.277 1.063,0.299 1.609,0.46 0.781,0.229 1.516,0.505 2.343,0.459 -0.137,0.046 -0.321,0 -0.459,0 C 2.619,4.917 1.976,4.733 1.287,4.596 0.827,4.504 0.414,4.32 -0.046,4.229 -0.322,4.137 -0.46,3.86 -0.781,3.906 v 0.138 c 0.459,0.552 1.011,1.103 1.746,1.149 0.827,0.138 1.609,0 2.436,-0.092 C 3.998,5.055 4.55,4.917 5.147,4.78 c 0.23,0 0.276,-0.368 0.46,-0.414 0.275,-0.092 0.551,0 0.827,-0.183 0,0.091 -0.046,0.183 0,0.275 C 6.618,4.641 6.847,4.412 7.031,4.504 7.399,4.733 6.71,5.147 6.526,5.469 6.526,5.515 6.572,5.561 6.572,5.561 6.939,5.239 7.215,4.871 7.674,4.641 7.904,4.55 8.456,4.412 8.364,4.688 8.134,5.193 7.674,5.607 7.307,6.066 V 6.25 C 7.215,6.25 7.215,6.296 7.169,6.342 V 6.526 C 6.985,6.618 7.031,6.802 6.939,6.939 6.802,7.169 6.893,7.491 6.802,7.768 6.71,8.042 6.664,8.272 6.618,8.548 6.48,9.33 6.296,10.019 6.204,10.754 c -0.092,0.873 0.506,1.562 0.919,2.345 0.322,0.55 0.69,1.102 1.287,1.469 0.138,0.553 0.506,1.012 0.873,1.472 0.367,0.447 0.977,0.72 1.419,0.918 0.642,0.288 1.221,0.466 1.221,0.466 h -31.54 V -6.895 H 2.719 c 0.875,0.629 1.749,0.929 2.97,1.53 0.577,0.285 1.896,0.891 2.343,1.338"/></g><g transform="translate(66.8799,24.32)" id="g34"><path id="path36" style="fill:#e1000f;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 h -26.161 c 0,0 0.049,-0.008 0.249,-0.115 0.212,-0.114 0.486,-0.261 0.658,-0.351 0.339,-0.177 0.666,-0.398 0.877,-0.736 0.093,-0.137 0.231,-0.413 0.139,-0.597 -0.092,-0.23 -0.139,-0.597 -0.368,-0.69 -0.277,-0.137 -0.643,-0.137 -0.965,-0.091 -0.185,0 -0.368,0.046 -0.552,0.091 0.689,-0.275 1.333,-0.597 1.793,-1.24 0.046,-0.092 0.228,-0.138 0.413,-0.138 0.046,0 0.046,-0.092 0.046,-0.138 -0.093,-0.092 -0.185,-0.138 -0.139,-0.276 h 0.139 c 0.229,0.092 0.184,0.552 0.506,0.414 0.229,-0.138 0.32,-0.46 0.183,-0.689 -0.183,-0.184 -0.368,-0.322 -0.551,-0.46 -0.046,-0.092 -0.046,-0.23 0,-0.322 0.137,-0.184 0.183,-0.367 0.229,-0.551 0.139,-0.322 0.185,-0.69 0.322,-1.011 0.185,-0.69 0.368,-1.379 0.322,-2.068 0,-0.368 -0.185,-0.689 -0.046,-1.057 0.092,-0.369 0.322,-0.644 0.506,-0.965 0.183,-0.277 0.367,-0.46 0.504,-0.737 0.277,-0.459 0.783,-0.919 0.552,-1.469 -0.137,-0.323 -0.643,-0.277 -0.965,-0.46 -0.275,-0.23 -0.045,-0.597 0.092,-0.827 0.23,-0.414 -0.275,-0.69 -0.597,-0.828 0.091,-0.137 0.276,-0.091 0.322,-0.183 0.046,-0.231 0.275,-0.368 0.138,-0.598 -0.184,-0.275 -0.737,-0.414 -0.46,-0.827 0.183,-0.321 0.065,-0.68 -0.046,-1.012 -0.137,-0.413 -0.505,-0.596 -0.827,-0.688 -0.277,-0.093 -0.597,-0.093 -0.874,-0.046 -0.091,0.046 -0.183,0.092 -0.276,0.092 -0.78,0.092 -1.561,0.321 -2.344,0.321 -0.228,-0.046 -0.459,-0.092 -0.642,-0.184 -0.208,-0.153 -0.393,-0.318 -0.557,-0.492 l -0.006,-0.006 c -0.034,-0.037 -0.066,-0.074 -0.099,-0.111 -0.021,-0.023 -0.04,-0.047 -0.06,-0.07 -0.013,-0.017 -0.025,-0.031 -0.039,-0.047 -0.134,-0.168 -0.255,-0.347 -0.361,-0.53 -0.007,-0.012 -0.015,-0.024 -0.021,-0.036 -0.013,-0.021 -0.023,-0.043 -0.036,-0.063 -0.15,-0.28 -0.265,-0.565 -0.348,-0.845 -0.311,-1.051 -0.174,-1.955 0.043,-2.174 0.063,-0.061 1.518,-0.51 2.532,-0.961 0.475,-0.211 0.808,-0.375 1.085,-0.549 l 25.69,0 z"/></g><g transform="translate(42.2744,15.4474)" id="g38"><path id="path40" style="fill:#9c9b9b;fill-opacity:1;fill-rule:nonzero;stroke:none" d="M 0,0 C 0.185,-0.046 0.459,-0.046 0.459,-0.138 0.368,-0.505 -0.184,-0.597 -0.46,-0.965 h -0.138 c -0.137,-0.092 -0.09,-0.322 -0.229,-0.322 -0.138,0.046 -0.276,0 -0.414,-0.046 0.184,-0.183 0.414,-0.322 0.689,-0.275 0.047,0 0.138,-0.092 0.138,-0.184 0,0 0.046,0 0.092,0.046 0.046,0 0.093,0 0.093,-0.046 v -0.184 c -0.139,-0.184 -0.369,-0.092 -0.553,-0.138 0.368,-0.092 0.736,-0.092 1.057,0 0.276,0.092 0,0.552 0.184,0.781 -0.091,0 0,0.138 -0.091,0.138 0.091,0.092 0.183,0.23 0.276,0.276 0.091,0 0.229,0.046 0.275,0.138 0,0.092 -0.184,0.138 -0.138,0.23 0.276,0.183 0.506,0.459 0.414,0.735 -0.046,0.138 -0.414,0.138 -0.644,0.23 -0.229,0.091 -0.505,0 -0.78,-0.046 -0.231,0 -0.459,-0.138 -0.69,-0.184 -0.322,-0.092 -0.598,-0.276 -0.874,-0.46 0.322,0.138 0.644,0.184 1.011,0.276 0.277,0 0.511,0.068 0.782,0"/></g></g></g></g></svg> <div>Départ➡</div></div>`;
                    break;
                case CARD_TYPES.FACTURE:
                    iconSvg =
                        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" viewBox="0 0 448 448" xml:space="preserve">                       <rect x="99" y="275" style="fill:#7AC943;" width="154" height="26"/>                        <path style="fill:#FFF8EF;" d="M43,51v363.9l52.3-55.2l0.1-0.1c0.3-0.1,0.8-0.2,1.4-0.2c0.4,0,1.4,0.3,2,0.9l53.9,59l54.4-33.7  l0.4-0.4c0,0,0.1-0.1,0.4-0.1c0.6,0,1.4,0.3,2,0.6l45.5,33.2l38-50c0.6-0.6,1.5-1.5,1.8-1.5h0.8c0.9,0,1.3,0.1,2.1,0.9l62.2,59.7  l44.7-50.1V51H43z M93,101h158v6H93V101z M93,157h158v6H93V157z M93,213h158v6H93V213z M259,304c0,1.2-1.8,3-3,3H96c-2,0-3-1.8-3-3  v-32c0-1.2,1-3,3-3h160c1.2,0,3,1.8,3,3V304z M363,267h-40v18h37c1.2,0,3,1.8,3,3v24c0,1.2-1.8,3-3,3h-13v8h-6v-8h-24v-6h40v-18h-37  c-1.2,0-3-1.8-3-3v-24c0-1.2,1.8-3,3-3h21v-8h6v8h16V267z M371,219h-70v-6h70V219z M371,163h-70v-6h70V163z M371,107h-70v-6h70V107z  "/>                        <path style="fill:#996632;" d="M11,19v58h26V48c0-2,1-3,3-3h368c1.2,0,3,1,3,3v29h26V19H11z"/>                        <g>                            <path style="fill:#E0CBB5;" d="M296,354.4L256,408l-31.2-37.6c-4.8-5.6-13.6-6.4-19.2-1.6l-42.4,37.6l40.8-25.6   c2.4-1.6,6.4-1.6,8.8,0l41.6,30.4l35.2-46.4c1.6-1.6,3.2-3.2,5.6-3.2h0.8c2.4,0,4,0.8,5.6,2.4l52,49.6l-41.6-60   C308,349.6,300,348.8,296,354.4z"/>                            <path style="fill:#E0CBB5;" d="M90.4,356c1.6-1.6,4-2.4,5.6-2.4c1.6,0,4,0.8,5.6,2.4l34.4,37.6l-31.2-44.8   c-4.8-7.2-15.2-8.8-22.4-3.2L64,360L48,56v346.4L90.4,356z"/>                        </g>                        <path style="fill:#42210B;" d="M296,208h80v16h-80V208z M296,152h80v16h-80V152z M296,96h80v16h-80V96z M368,288v24c0,4-4,8-8,8h-8  v8h-16v-8h-24v-16h40v-8h-32c-4,0-8-4-8-8v-24c0-4,4-8,8-8h16v-8h16v8h16v16h-40v8h32C364,280,368,284,368,288z M88,208h168v16H88  V208z M88,152h168v16H88V152z M88,96h168v16H88V96z M96,264h160c4,0,8,4,8,8v32c0,4-4,8-8,8H96c-4.8,0-8-4-8-8v-32  C88,268,91.2,264,96,264z M248,296v-16H104v16H248z M40,40h368c4,0,8,3.2,8,8v24h16V24H16v48h16V48C32,43.2,35.2,40,40,40z   M254.4,411.2l35.2-46.4c1.6-1.6,3.2-3.2,5.6-3.2h0.8c2.4,0,4,0.8,5.6,2.4l58.4,56l40-44.8V56H48v346.4l42.4-45.6  c1.6-1.6,4-2.4,5.6-2.4c2.4,0,4,0.8,5.6,2.4l51.2,56l50.4-31.2c3.2-1.6,6.4-1.6,8.8,0L254.4,411.2z M0,80V16c0-4.8,3.2-8,8-8h432  c4,0,8,3.2,8,8v64c0,4-4,8-8,8h-24v291.2c0,2.4-0.8,4-2.4,5.6l-48,52.8c-0.8,1.6-3.2,2.4-5.6,2.4l0,0c-2.4,0-4-0.8-5.6-2.4  l-57.6-55.2l-34.4,44.8c-2.4,3.2-7.2,4-11.2,1.6l-44-32l-51.2,32c-3.2,2.4-7.2,1.6-10.4-1.6L96,373.6L45.6,428  c-2.4,2.4-5.6,3.2-8.8,2.4c-2.4-1.6-4.8-4.8-4.8-8V88H8C3.2,88,0,84,0,80z"/>                       </svg>';
                    break;
                case CARD_TYPES.BONUS:
                    iconSvg = `<svg viewBox="0 0 1024 1024" class="icon" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M902.3 517.4l-3.2 4.9c-0.6 1-63.7 96.2-145 209.5-62.8 87.5-135.9 99.1-170.5 99.1-11.6 0-18.9-1.3-20.1-1.5H356l-14.5-14.3h223.4c5.4 0.9 99.1 17.3 177.5-91.7 70.5-98.1 127-182.5 141.2-203.8-10.2-8.3-43-35.2-74.6-30.1-10.2 1.7-25.6 13.2-42.5 29.9l-2.3-2.3v-16.9c16.2-13.8 31.3-23.1 42.6-24.9 47.3-7.7 89.6 36.4 91.2 38l4.3 4.1z" fill="#C9971C"></path><path d="M883.6 519.6c-14.2 21.4-70.7 105.8-141.2 203.8-78.4 109-172.1 92.6-177.5 91.7H341.5L186.8 661.9C200.6 638.4 274 530.7 440 582c7.5 6.3 44.5 31.2 130.8 11.3 11.6-2.7 21.7-3.8 30.6-3.8 26.7 0 41.6 10.5 49.6 20.8 13.7 17.4 13.7 41.3 6.8 55.1-14.1 28.1-37.5 40.6-75.8 40.6H454.5v14.3H582c44 0 72.1-15.5 88.7-48.6 3.2-6.5 5.2-14.8 5.6-23.7l0.1 0.3c13.4-36.6 55-94 90.2-128.9 16.9-16.8 32.2-28.3 42.5-29.9 31.5-5.1 64.3 21.7 74.5 30.1z" fill="#FFF0C2"></path><path d="M796.5 265.2v75.6c0 16.4-13.3 29.7-29.7 29.7h-2.6v129.8c-4.5 4-9.1 8.2-13.8 12.7V370.5H605.1v204.9c-5-0.3-10.4-0.1-16.1 0.5V252.5c-1.4 0-2.6 0.1-4 0.1-11 0-22.6-0.4-34.9-1H546.6c-4.9 0.3-9.5 0.4-14.1 0.6v332.9c-5.8 0.6-11.1 1-16.1 1.2V370.5H367v183.9c-4.7-0.4-9.3-0.4-13.8-0.4V370.5h-6.5c-16.4 0-29.8-13.3-29.8-29.7v-75.6c0-16.4 13.4-29.7 29.8-29.7h66.5c-11.5-6.1-20.1-13.6-25.3-22.8-15.9-28.1 4.7-58.8 5.6-60.1 14.8-18 31.5-25.8 50-23.7 47.1 5.2 90.5 75.8 104.9 101.5 14.5-25.7 57.9-96.3 105-101.5 18.4-2.2 35.2 5.6 49.6 23 1.3 1.9 21.9 32.6 6 60.7-5.2 9.2-13.8 16.6-25.3 22.8h83.2c16.3 0.1 29.6 13.4 29.6 29.8z m-16.1 75.6v-75.6c0-7.5-6.1-13.6-13.6-13.6H614.3c-3.1 0.1-6 0.4-9.2 0.5v102.2h161.8c7.4 0 13.5-6 13.5-13.5zM694.9 205c11-19.4-4.7-43-4.9-43.2-10.5-12.5-22.1-18.3-34.9-16.8-34.8 3.8-73 58.8-91 90.5H616c51.2-3.9 71.6-17.7 78.9-30.5z m-214.5 30.5h52.2c-18-31.7-56.1-86.7-90.9-90.5-12.9-1.4-24.6 4.2-35.4 17.4 0.1 0-15.2 23.3-4.3 42.6 7.2 12.6 27.3 26.6 78.4 30.5z m36.1 118.8V252.7h-4.7c-10.5 0-20.1-0.4-29.3-1H346.7c-7.5 0-13.6 6-13.6 13.6v75.6c0 7.5 6 13.6 13.6 13.6h169.8z" fill="#EF4666"></path><path d="M780.4 265.2v75.6c0 7.5-6.1 13.6-13.6 13.6H605.1V252.2c3.2-0.1 6.1-0.4 9.2-0.5h152.6c7.4 0 13.5 6 13.5 13.5z" fill="#FFF0C2"></path><path d="M764.3 517.1l2.3 2.3c-35.2 34.9-76.7 92.3-90.2 128.9l-0.1-0.3c0.6-8.6-0.4-17.9-3.5-26.9 15.1-36.2 46.8-78.5 77.6-108.3v10.9l8.4-6.6h5.5z" fill="#C9971C"></path><path d="M764.3 500.2v16.9h-5.4l-8.4 6.6v-10.9c4.7-4.4 9.3-8.6 13.8-12.6z" fill="#C9971C"></path><path d="M750.5 370.5V513c-30.8 29.8-62.5 72.1-77.6 108.3-2.3-6.9-5.8-13.7-10.6-19.8-8.2-10.4-25.2-24.9-57.2-26.1V370.5h145.4z" fill="#FFE085"></path><path d="M690 161.8c0.1 0.3 15.9 23.8 4.9 43.2-7.3 12.8-27.6 26.6-78.9 30.6h-52c18-31.7 56.3-86.7 91-90.5 12.9-1.6 24.5 4.1 35 16.7z" fill="#F59A9B"></path><path d="M672.9 621.2c3.1 9 4.1 18.3 3.5 26.9l-6.1-20.1c0.7-2.2 1.5-4.5 2.6-6.8z" fill="#C9971C"></path><path d="M670.2 628l6.1 20.1c-0.4 8.8-2.4 17.1-5.6 23.7-16.6 33.1-44.8 48.6-88.7 48.6H454.5V706H582c38.4 0 61.8-12.5 75.8-40.7 6.9-13.8 6.9-37.7-6.8-55.1-8.1-10.4-22.9-20.8-49.6-20.8v-4h3.7v-10.1c32 1.2 49 15.7 57.2 26.1 4.9 6.1 8.3 12.9 10.6 19.8-1.1 2.3-1.9 4.6-2.7 6.8z" fill="#C9971C"></path><path d="M605.1 575.3v10.1h-3.7l-12.4 0.3v-9.8c5.7-0.7 11.1-0.8 16.1-0.6z" fill="#C9971C"></path><path d="M601.4 585.4v4c-8.8 0-18.9 1.2-30.6 3.8-86.3 19.9-123.3-5-130.8-11.3-166-51.3-239.4 56.4-253.2 79.9l-10.4-10.4c15.5-24.9 69.4-96.5 176.7-97.6v6.1H367v-5.8c23.7 0.9 49.9 5.5 78.6 14.5l1.7 0.5 1.3 1.2c0.3 0.3 19.1 17.4 67.9 15.9v5h5l11.1-0.1v-6c10.5-1 22.1-2.9 35-5.9 7.7-1.7 14.8-2.8 21.4-3.5v9.8l12.4-0.1z" fill="#C9971C"></path><path d="M589 252.5v323.3c-6.5 0.6-13.7 1.8-21.4 3.5-12.9 2.9-24.6 4.9-35 5.9V252.3c4.6-0.3 9.2-0.4 14.1-0.6H550.2c12.3 0.6 23.9 1 34.9 1 1.3 0 2.5-0.2 3.9-0.2z" fill="#F59A9B"></path><path d="M532.6 585.2v6l-11.1 0.1h-5v-5c5-0.1 10.3-0.5 16.1-1.1z" fill="#C9971C"></path><path d="M532.6 235.5h-52.2c-51.2-4-71.2-17.9-78.5-30.6-10.9-19.3 4.5-42.6 4.3-42.6 10.9-13.2 22.5-18.8 35.4-17.4 34.9 3.9 73 58.9 91 90.6z" fill="#F59A9B"></path><path d="M516.5 370.5v215.9c-48.8 1.5-67.6-15.6-67.9-15.9l-1.3-1.2-1.7-0.5c-28.8-9-55-13.6-78.6-14.5V370.5h149.5z" fill="#FFE085"></path><path d="M516.5 252.7v101.7H346.7c-7.5 0-13.6-6-13.6-13.6v-75.6c0-7.5 6-13.6 13.6-13.6h135.8c9.2 0.6 18.8 1 29.3 1 1.5 0.1 3.1 0.1 4.7 0.1z" fill="#FFF0C2"></path><path d="M367 554.3v5.8h-13.8V554c4.5 0 9.1 0 13.8 0.3zM360.6 834c19.2 19.1 19.4 50.3 0.3 69.4l-21.6 21.9c-9.2 9.3-21.5 14.5-34.7 14.5h-0.3c-13 0-25.3-5-34.5-14.1L72.5 730.3C63.3 721 58 708.7 58 695.5s5-25.4 14.2-34.8l21.6-21.9c9.2-9.2 21.5-14.5 34.7-14.5h0.3c13 0 25.3 5 34.7 14.2l13 12.9c-3.2 5.1-4.7 8.3-4.9 8.6l12.8 6.1c0.1-0.1 0.9-1.7 2.4-4.3L341.5 815H334v12.7l-180.7-179c-6.5-6.4-15.2-10-24.6-10h-0.1c-9.3 0-18.2 3.7-24.7 10.2l-21.6 21.9c-6.5 6.5-10 15.3-10 24.7 0 9.3 3.7 18 10.2 24.6l197.3 195.4c6.5 6.5 15.2 10.1 24.4 10.1h0.3c9.3-0.1 18-3.7 24.6-10.4l21.6-21.7c13.6-13.7 13.4-35.8-0.3-49.4l-14.8-14.7H356l4.6 4.6z" fill="#C9971C"></path><path d="M356 829.4h-20.3l-1.7-1.7v-12.6h7.5z" fill="#C9971C"></path><path d="M350.5 844.1c13.7 13.6 13.8 35.7 0.3 49.4l-21.6 21.7c-6.5 6.6-15.2 10.2-24.6 10.4h-0.3c-9.2 0-17.9-3.6-24.4-10.1L82.6 720.1c-6.5-6.5-10.2-15.2-10.2-24.6 0-9.3 3.5-18.2 10-24.7l21.6-21.9c6.5-6.5 15.3-10.2 24.7-10.2h0.1c9.3 0 18 3.6 24.6 10l180.7 179v1.7h1.7l14.7 14.7z" fill="#C9971C"></path><path d="M335.7 829.4H334v-1.7zM176.4 651.5l10.4 10.4c-1.5 2.7-2.3 4.2-2.4 4.3l-12.8-6.1c0.1-0.3 1.7-3.5 4.8-8.6z" fill="#C9971C"></path></g></svg>`;
                    break;
                case CARD_TYPES.PDB:
                    iconSvg =
                        '<svg width="69" height="42" viewBox="0 0 69 42" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect width="68.88" height="42" fill="url(#pattern0_70_524)"/><defs><pattern id="pattern0_70_524" patternContentUnits="objectBoundingBox" width="1" height="1"><use xlink:href="#image0_70_524" transform="matrix(0.0184832 0 0 0.0303125 -0.097561 -0.42)"/></pattern><image id="image0_70_524" width="64" height="64" preserveAspectRatio="none" xlink:href="data:image/png;base64,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"/></defs></svg>';
                    break;

                case CARD_TYPES.INTERACTION:
                    iconSvg =
                        '<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect width="48" height="48" fill="url(#pattern0_61_255)"/><defs><pattern id="pattern0_61_255" patternContentUnits="objectBoundingBox" width="1" height="1"><use xlink:href="#image0_61_255" transform="scale(0.0078125)"/></pattern>+<image id="image0_61_255" width="128" height="128" preserveAspectRatio="none" xlink:href="data:image/png;base64,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"/></defs></svg>';
                    break;
                case CARD_TYPES.BIENS:
                    iconSvg =
                        '<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 486 511.942"><path fill-rule="nonzero" d="M269.863 203.715v249.556h135.206c3.748 0 7.138 1.537 9.579 3.978a13.552 13.552 0 013.982 9.582v31.55c0 3.693-1.552 7.092-4.008 9.554l.021.02c-2.445 2.445-5.85 3.987-9.574 3.987H83.853c-3.669 0-7.066-1.524-9.54-3.983l-.042-.042c-2.444-2.46-3.979-5.829-3.979-9.536v-31.55c0-3.738 1.523-7.131 3.976-9.584a13.523 13.523 0 019.585-3.976h135.249l.001-249.364a54.7 54.7 0 01-13.567-9.9 55.038 55.038 0 01-9.944-13.549h-74.523v3.279c0 3.738-1.524 7.131-3.977 9.584a13.525 13.525 0 01-9.584 3.976h-3.696l51.539 121.755h33.524v10.755c0 26.075-10.572 49.685-27.662 66.775-17.09 17.09-40.7 27.663-66.776 27.663-26.075 0-49.685-10.573-66.775-27.663C10.571 379.492 0 355.882 0 329.807v-10.755H33.614l52.978-121.755h-2.765a13.528 13.528 0 01-9.586-3.976 13.529 13.529 0 01-3.976-9.584v-3.279H57.553a14.313 14.313 0 01-9.28-3.429c-2.928-2.509-4.74-6.092-4.74-10.131v-23.682c0-4.042 1.815-7.621 4.74-10.132a14.308 14.308 0 019.28-3.43h138.182a55.124 55.124 0 0116.966-19.301c8.942-6.307 19.832-10.013 31.563-10.013 11.732 0 22.62 3.706 31.563 10.013a55.134 55.134 0 0116.966 19.301h138.576c3.524 0 6.817 1.314 9.28 3.43 2.926 2.511 4.741 6.09 4.741 10.132v23.682c0 4.039-1.813 7.622-4.741 10.131a14.304 14.304 0 01-9.28 3.429h-15.712v3.279c0 3.738-1.524 7.131-3.976 9.584a13.531 13.531 0 01-9.585 3.976h-1.16l51.54 121.755H486v10.755c0 26.075-10.573 49.685-27.663 66.775-17.089 17.09-40.7 27.663-66.775 27.663-26.076 0-49.686-10.573-66.775-27.663-17.091-17.09-27.663-40.7-27.663-66.775v-10.755h33.615l52.977-121.755h-5.301a13.528 13.528 0 01-9.586-3.976 13.529 13.529 0 01-3.976-9.584v-3.279h-71.915a55.214 55.214 0 01-23.075 23.257zm74.241 115.337h95.079l-46.885-110.761-48.194 110.761zm-297.124 0h95.079L95.174 208.291 46.98 319.052z"/><path fill="#FFE27B" d="M259.108 196.743v267.282h145.961c1.543 0 2.806 1.286 2.806 2.806v31.55c0 1.516-1.29 2.806-2.806 2.806H83.853c-1.516 0-2.806-1.262-2.806-2.806v-31.55a2.815 2.815 0 012.806-2.806h145.961l.001-267.143c-12.717-4.409-22.792-14.469-27.215-27.179h-92.286v14.034a2.814 2.814 0 01-2.806 2.805H83.827a2.815 2.815 0 01-2.807-2.805v-14.034H57.553c-1.796 0-3.265-1.262-3.265-2.805v-23.682c0-1.544 1.469-2.807 3.265-2.807h145.151c6.081-17.081 22.391-29.314 41.56-29.314 19.168 0 35.479 12.233 41.561 29.314h145.544c1.797 0 3.266 1.263 3.266 2.807v23.682c0 1.543-1.469 2.805-3.266 2.805h-26.467v14.034a2.814 2.814 0 01-2.806 2.805h-23.681a2.814 2.814 0 01-2.807-2.805v-14.034h-89.677c-4.378 12.578-14.291 22.562-26.823 27.04z"/><path fill-rule="nonzero" d="M244.264 125.225c16.524 0 29.977 13.472 29.977 29.977 0 16.531-13.461 29.975-29.977 29.975-8.275 0-15.77-3.357-21.194-8.781-5.424-5.425-8.782-12.92-8.782-21.194 0-8.275 3.358-15.771 8.782-21.195 5.424-5.425 12.919-8.782 21.194-8.782z"/><path fill="#EA542B" d="M244.264 135.98c10.615 0 19.222 8.606 19.222 19.222 0 10.614-8.607 19.221-19.222 19.221-10.616 0-19.221-8.607-19.221-19.221 0-10.616 8.605-19.222 19.221-19.222z"/><path fill="#FFC54A" d="M94.437 329.807H10.755c0 46.217 37.466 83.683 83.682 83.683 46.217 0 83.683-37.466 83.683-83.683H94.437zM391.562 329.807h-83.683c0 46.217 37.466 83.683 83.683 83.683 46.217 0 83.683-37.466 83.683-83.683h-83.683z"/><path fill="#FE3150" d="M391.563 0c30.752 0 55.678 24.927 55.678 55.678 0 30.749-24.926 55.677-55.678 55.677-30.75.002-55.678-24.926-55.678-55.677C335.885 24.926 360.813 0 391.563 0z"/><path fill="#fff" d="M405.083 33.134a6.155 6.155 0 018.767-.023c2.426 2.437 2.436 6.402.024 8.852l-13.567 13.72 13.577 13.73c2.396 2.432 2.361 6.37-.07 8.798-2.434 2.428-6.347 2.421-8.74-.011l-13.507-13.655-13.526 13.676a6.153 6.153 0 01-8.766.024c-2.426-2.437-2.438-6.402-.024-8.852l13.567-13.72-13.578-13.729c-2.395-2.431-2.361-6.37.072-8.799 2.433-2.428 6.346-2.421 8.738.011l13.508 13.657 13.525-13.679z"/><path fill="#68D166" d="M94.439.006c30.747 0 55.671 24.924 55.671 55.67 0 30.747-24.924 55.671-55.671 55.671S38.768 86.423 38.768 55.676c0-30.746 24.924-55.67 55.671-55.67z"/><path fill="#fff" d="M65.747 58.451c.819-4.748 6.24-7.392 10.516-4.82.389.232.759.507 1.103.822l.033.031c1.92 1.839 4.07 3.753 6.202 5.651l1.828 1.642 25.07-26.132c1.297-1.357 2.244-2.234 4.189-2.673 6.659-1.468 11.339 6.671 6.62 11.645L90.893 76.37c-2.547 2.717-7.1 2.965-9.838.37-1.57-1.458-3.277-2.94-5.002-4.436-2.989-2.598-6.037-5.247-8.523-7.87-1.491-1.49-2.135-3.931-1.783-5.983z"/></svg>';
                    break;
                case CARD_TYPES.REDEVANCE:
                    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" height="800px" width="800px" version="1.1" id="Layer_1" viewBox="0 0 512 512" xml:space="preserve">
                    <polygon style="fill:#F2B851;" points="59.52,512 59.52,212.4 256,70.912 452.48,212.4 452.48,512 "/>
                    <path style="fill:#FFFFFF;" d="M336.768,417.664c-10.784,6.016-29.184,12.048-49.504,12.048c-31.104,0-59.664-12.688-77.456-36.176  c-8.56-10.8-14.912-24.432-17.76-41.264h-20.624v-22.528h17.456c0-1.6,0-3.488,0-5.392c0-3.168,0.32-6.352,0.32-9.536h-17.76  v-22.528h21.248c4.144-17.136,11.744-31.728,21.904-43.472c18.096-20.32,43.488-32.368,73.312-32.368  c19.36,0,36.192,4.448,47.616,9.52l-8.896,36.176c-8.256-3.488-21.264-7.616-35.216-7.616c-15.232,0-29.2,5.072-39.04,17.136  c-4.432,5.072-7.936,12.368-10.16,20.624h79.024v22.528H237.44c-0.336,3.168-0.336,6.672-0.336,9.84c0,1.904,0,3.168,0,5.072h84.112  v22.528h-79.664c2.224,9.536,5.696,16.832,10.464,22.224c10.16,11.424,25.072,16.192,40.944,16.192  c14.608,0,29.52-4.768,36.192-8.256L336.768,417.664z"/>
                    <polygon style="fill:#2C3E50;" points="256,0 20.016,168.784 20.016,207.184 256,38.4 491.984,207.184 491.984,168.784 "/>
                    </svg>`;
                    break;
                case CARD_TYPES.LOGO:
                    iconSvg = `La Bonne Gestion Immobilière`;
                    break;
                default:
                    console.log("Type de carte non reconnu:", cellType);
            }

            iconElement.innerHTML = iconSvg;
            cellElement.appendChild(iconElement);

            // Ajoute un gestionnaire d'événements pour le clic sur la cellule
            cellElement.addEventListener("click", () =>
                handleCellClick(cell.id, cell.type),
            );

            boardElement.appendChild(cellElement);
        }
    }
}

// Met à jour l'affichage du dé
function updateDiceDisplay(value) {
    // Met à jour le dé normal
    const diceElement = document.getElementById("dice");

    if (diceElement) {
        diceElement.dataset.value = value;

        // Mettre à jour l'apparence du dé
        const faceElement = document.getElementById("dice-face");
        if (faceElement) {
            // Supprimer tous les points existants
            const dots = faceElement.querySelectorAll(".dot");
            dots.forEach((dot) => {
                if (!dot.classList.contains("center")) {
                    dot.remove();
                }
            });

            // Afficher le centre uniquement pour le 1
            const centerDot = faceElement.querySelector(".center");
            if (centerDot) {
                centerDot.style.display = value === 1 ? "block" : "none";
            }

            // Ajouter les points selon la valeur
            switch (value) {
                case 2:
                    addDot(faceElement, "top-left");
                    addDot(faceElement, "bottom-right");
                    break;
                case 3:
                    addDot(faceElement, "top-left");
                    addDot(faceElement, "center");
                    addDot(faceElement, "bottom-right");
                    break;
                case 4:
                    addDot(faceElement, "top-left");
                    addDot(faceElement, "top-right");
                    addDot(faceElement, "bottom-left");
                    addDot(faceElement, "bottom-right");
                    break;
                case 5:
                    addDot(faceElement, "top-left");
                    addDot(faceElement, "top-right");
                    addDot(faceElement, "center");
                    addDot(faceElement, "bottom-left");
                    addDot(faceElement, "bottom-right");
                    break;
                case 6:
                    addDot(faceElement, "top-left");
                    addDot(faceElement, "top-right");
                    addDot(faceElement, "middle-left");
                    addDot(faceElement, "middle-right");
                    addDot(faceElement, "bottom-left");
                    addDot(faceElement, "bottom-right");
                    break;
            }
        }
    }

    // Met également à jour le dé en plein écran
    updateFullscreenDice(value);
}

// Met à jour l'affichage du dé en plein écran
function updateFullscreenDice(value) {
    const fullscreenDice = document.getElementById("fullscreen-dice");

    if (fullscreenDice) {
        fullscreenDice.setAttribute("data-value", value);

        // Mettre à jour l'apparence du dé en plein écran
        const fullscreenFace = fullscreenDice.querySelector(".dice-face");
        if (fullscreenFace) {
            // Supprimer d'abord tous les points existants
            fullscreenFace.innerHTML = "";

            // Ajouter les points selon la valeur du dé
            switch (parseInt(value)) {
                case 1:
                    // Seulement un point central
                    const centerDot = document.createElement("div");
                    centerDot.className = "dot center";
                    fullscreenFace.appendChild(centerDot);
                    break;

                case 2:
                    // Points en haut à gauche et en bas à droite
                    const topLeft2 = document.createElement("div");
                    topLeft2.className = "dot top-left";
                    fullscreenFace.appendChild(topLeft2);

                    const bottomRight2 = document.createElement("div");
                    bottomRight2.className = "dot bottom-right";
                    fullscreenFace.appendChild(bottomRight2);
                    break;

                case 3:
                    // Points en haut à gauche, au centre et en bas à droite
                    const topLeft3 = document.createElement("div");
                    topLeft3.className = "dot top-left";
                    fullscreenFace.appendChild(topLeft3);

                    const center3 = document.createElement("div");
                    center3.className = "dot center";
                    fullscreenFace.appendChild(center3);

                    const bottomRight3 = document.createElement("div");
                    bottomRight3.className = "dot bottom-right";
                    fullscreenFace.appendChild(bottomRight3);
                    break;

                case 4:
                    // Points aux quatre coins
                    const topLeft4 = document.createElement("div");
                    topLeft4.className = "dot top-left";
                    fullscreenFace.appendChild(topLeft4);

                    const topRight4 = document.createElement("div");
                    topRight4.className = "dot top-right";
                    fullscreenFace.appendChild(topRight4);

                    const bottomLeft4 = document.createElement("div");
                    bottomLeft4.className = "dot bottom-left";
                    fullscreenFace.appendChild(bottomLeft4);

                    const bottomRight4 = document.createElement("div");
                    bottomRight4.className = "dot bottom-right";
                    fullscreenFace.appendChild(bottomRight4);
                    break;

                case 5:
                    // Points aux quatre coins + centre
                    const topLeft5 = document.createElement("div");
                    topLeft5.className = "dot top-left";
                    fullscreenFace.appendChild(topLeft5);

                    const topRight5 = document.createElement("div");
                    topRight5.className = "dot top-right";
                    fullscreenFace.appendChild(topRight5);

                    const center5 = document.createElement("div");
                    center5.className = "dot center";
                    fullscreenFace.appendChild(center5);

                    const bottomLeft5 = document.createElement("div");
                    bottomLeft5.className = "dot bottom-left";
                    fullscreenFace.appendChild(bottomLeft5);

                    const bottomRight5 = document.createElement("div");
                    bottomRight5.className = "dot bottom-right";
                    fullscreenFace.appendChild(bottomRight5);
                    break;

                case 6:
                    // 6 points (3 de chaque côté)
                    const topLeft6 = document.createElement("div");
                    topLeft6.className = "dot top-left";
                    fullscreenFace.appendChild(topLeft6);

                    const topRight6 = document.createElement("div");
                    topRight6.className = "dot top-right";
                    fullscreenFace.appendChild(topRight6);

                    const middleLeft6 = document.createElement("div");
                    middleLeft6.className = "dot middle-left";
                    fullscreenFace.appendChild(middleLeft6);

                    const middleRight6 = document.createElement("div");
                    middleRight6.className = "dot middle-right";
                    fullscreenFace.appendChild(middleRight6);

                    const bottomLeft6 = document.createElement("div");
                    bottomLeft6.className = "dot bottom-left";
                    fullscreenFace.appendChild(bottomLeft6);

                    const bottomRight6 = document.createElement("div");
                    bottomRight6.className = "dot bottom-right";
                    fullscreenFace.appendChild(bottomRight6);
                    break;
            }
        }
    }
}

// Ajoute un point au dé
function addDot(faceElement, position) {
    const dot = document.createElement("div");
    dot.className = `dot ${position}`;

    // Positionnement des points selon leur position
    switch (position) {
        case "top-left":
            dot.style.gridArea = "1 / 1";
            break;
        case "top-right":
            dot.style.gridArea = "1 / 3";
            break;
        case "middle-left":
            dot.style.gridArea = "2 / 1";
            break;
        case "center":
            dot.style.gridArea = "2 / 2";
            break;
        case "middle-right":
            dot.style.gridArea = "2 / 3";
            break;
        case "bottom-left":
            dot.style.gridArea = "3 / 1";
            break;
        case "bottom-right":
            dot.style.gridArea = "3 / 3";
            break;
    }

    faceElement.appendChild(dot);
}

// Affiche la modalité de propriété
function showPropertyModal(property) {
    document.getElementById("property-name").textContent = property.name;
    document.getElementById("property-description").textContent =
        property.description;
    document.getElementById("property-value-amount").textContent =
        `${property.value} K`;

    toggleModal("property-modal", true);
}

// Affiche la modalité vidéo
function showVideoModal(duration = "00:15") {
    document.getElementById("video-duration").textContent = duration;
    document.getElementById("progress-bar").style.width = "0%";

    toggleModal("video-modal", true);

    // Simuler la progression de la vidéo
    const totalDurationInSeconds = duration
        .split(":")
        .reduce((acc, time) => 60 * acc + parseInt(time), 0);
    const interval = 100; // Mise à jour toutes les 100ms
    const incrementPerInterval = 100 / (totalDurationInSeconds * 10); // 10 intervalles par seconde

    let progress = 0;
    const progressBar = document.getElementById("progress-bar");

    const timer = setInterval(() => {
        progress += incrementPerInterval;
        if (progress >= 100) {
            clearInterval(timer);
            progress = 100;
            // Ferme automatiquement après la fin de la vidéo
            setTimeout(() => toggleModal("video-modal", false), 500);
        }
        progressBar.style.width = `${progress}%`;
    }, interval);

    // Stocke le timer pour pouvoir l'annuler si nécessaire
    window.videoTimer = timer;
}

// Affiche la modalité de victoire
function showWinModal(score, teamName = null) {
    // Met à jour le score final
    document.getElementById("final-score").textContent = `${score} K`;

    // Si un nom d'équipe est fourni, afficher qui a gagné
    const winTitle = document.querySelector("#win-modal h3");
    if (teamName && winTitle) {
        winTitle.textContent = `Félicitations ${teamName} !`;
    } else {
        // Trouve l'équipe gagnante à partir du score
        const gameState = getGameState();
        const winningTeams = Object.values(gameState.teams).filter(
            (team) => team.active && team.score === score,
        );

        if (winningTeams.length > 0 && winTitle) {
            winTitle.textContent = `Félicitations ${winningTeams[0].name} !`;
        }
    }

    // Ajoute un effet d'animation de confettis ou de célébration
    document.body.classList.add("win-celebration");

    // Joue un son de victoire si disponible
    const winSound = new Audio("assets/win.wav");
    winSound.volume = 0.5;
    winSound.play().catch((e) => console.log("Pas de son disponible"));

    // Affiche la modale
    toggleModal("win-modal", true);

    // Arrête le timer de jeu s'il est en cours
    if (window.gameTimerInterval) {
        clearInterval(window.gameTimerInterval);
    }
}

// Affiche la modalité de sortie
function showExitModal() {
    toggleModal("exit-modal", true);
}

// Met à jour la liste des joueurs
function updatePlayerList() {
    const gameState = getGameState();
    const activeTeam = gameState.teams[gameState.activeTeam];
    const playerListElement = document.getElementById("player-list");

    if (!playerListElement || !activeTeam) return;

    // Clear the current list
    playerListElement.innerHTML = "";

    // Add players of the active team
    activeTeam.players.forEach((player, index) => {
        const playerElement = document.createElement("div");
        playerElement.className = "player";
        playerElement.textContent = player;

        // Highlight the current player
        if (index === activeTeam.currentPlayer) {
            playerElement.classList.add("current-player");
        }

        playerListElement.appendChild(playerElement);
    });
}

function updateTeamsCorners() {
    const gameState = getGameState();
    const corners = [
        { id: 1, el: document.getElementById("team1-corner") },
        { id: 2, el: document.getElementById("team2-corner") },
        { id: 3, el: document.getElementById("team3-corner") },
        { id: 4, el: document.getElementById("team4-corner") },
    ];
    corners.forEach(({ id, el }) => {
        if (!el) return;
        const team = gameState.teams[id];
        if (team && team.active && team.players.length > 0) {
            el.innerHTML =
                `<span class="team-name">${team.name}</span>` +
                team.players
                    .map((p, idx) => `<div class="player">${p}</div>`)
                    .join("");
            el.style.display = "";
        } else {
            el.innerHTML = "";
            el.style.display = "none";
        }
    });
}

function updateCurrentPlayerInfo() {
    const gameState = getGameState();
    const activeTeam = gameState.teams[gameState.activeTeam];
    const currentPlayerContainer = document.querySelector(
        "#current-player-info .player-list-content",
    );

    if (!currentPlayerContainer || !activeTeam) return;

    // Effacer le contenu actuel
    currentPlayerContainer.innerHTML = "";

    if (activeTeam.players.length > 0) {
        const currentPlayerIdx = activeTeam.currentPlayer;
        const playerName = activeTeam.players[currentPlayerIdx];

        // Créer un élément stylisé pour le joueur actif
        const playerElement = document.createElement("div");
        playerElement.className = "active-player-highlight";
        playerElement.style.background = `var(--team${gameState.activeTeam}-color)`;
        playerElement.innerHTML = `<span> <strong>${playerName.name}</strong> (${activeTeam.name})</span>`;

        currentPlayerContainer.appendChild(playerElement);
    }
}

function updateTeamPanels() {
    const gameState = getGameState();
    const panels = [
        { id: 1, el: document.getElementById("team1-panel") },
        { id: 2, el: document.getElementById("team2-panel") },
        { id: 3, el: document.getElementById("team3-panel") },
        { id: 4, el: document.getElementById("team4-panel") },
    ];

    panels.forEach(({ id, el }) => {
        if (!el) return;
        const team = gameState.teams[id];

        if (team) {
            const isActiveTeam = id === gameState.activeTeam;
            let html = `<div class="team-name" style="color:var(--team${id}-color)">${team.name}</div>`;

            if (team.players.length > 0) {
                team.players.forEach((player, idx) => {
                    const isActivePlayer =
                        isActiveTeam && idx === team.currentPlayer;
                    const playerClass = isActivePlayer
                        ? "player current-player"
                        : "player";
                    const playerStyle = isActivePlayer
                        ? `style="color: var(--accent-color); font-weight: bold;"`
                        : "";
                    html += `<div class="${playerClass}" ${playerStyle}>${player}</div>`;
                });
            } else {
                html += `<div class="no-players">Aucun joueur</div>`;
            }

            // Si vous avez un score à afficher, ajoutez-le ici, par exemple :
            if (typeof team.score !== "undefined") {
                html += `<div class="team-score">Score : ${team.score}</div>`;
            }

            el.innerHTML = html;
            el.style.display = "flex";

            if (isActiveTeam) {
                el.classList.add("active-panel");
            } else {
                el.classList.remove("active-panel");
            }
        } else {
            el.style.display = "none";
        }
    });
}
