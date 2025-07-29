const CARD_TYPES = {
    DEPART: "depart",
    BONUS: "bonus",
    FACTURE: "facture",
    INTERACTION: "interaction",
    BIENS: "biens",
    PDB: "pdb",
    REDEVANCE: "redevance",
    LOGO: "logo",
};

function generateInitialBoard() {
    const board = [];
    const allTypes = [
        CARD_TYPES.BONUS,
        CARD_TYPES.PDB,
        CARD_TYPES.FACTURE,
        CARD_TYPES.INTERACTION,
        CARD_TYPES.BIENS,
    ];

    // Distribution des types de cartes (comme dans l'image) ---
    const typeDistribution = {
        [CARD_TYPES.BONUS]: 6, //  cartes bonus (cadeaux)
        [CARD_TYPES.PDB]: 5, //  cartes PDB (pdb)
        [CARD_TYPES.FACTURE]: 7, //  cartes facture
        [CARD_TYPES.INTERACTION]: 5, //  cartes interaction
        [CARD_TYPES.BIENS]: 6, //  cartes biens
        [CARD_TYPES.REDEVANCE] : 3, // cartes redevance
    };

    // Crée un tableau avec tous les types selon leur distribution
    let typesToAssign = [];
    Object.entries(typeDistribution).forEach(([type, count]) => {
        for (let i = 0; i < count; i++) {
            typesToAssign.push(type);
        }
    });

    // Triple mélange pour éviter les patterns répétitifs
    typesToAssign = shuffleArray(typesToAssign);

    const spiralOrder = getSpiralOrder();

    // Ajoute la case depart fixe à la 1ere
    board.push({
        id: 0,
        type: CARD_TYPES.DEPART,
        highlight: false,
        visited: false,
        position: 0,
        gridPosition: spiralOrder[0], // Dernière position dans la spirale
    });

    for (let i = 1; i < 32; i++) {
        let type = typesToAssign[i];
        // Vérifie si la carte actuelle est la même que la précédente
        if (i > 1 && board[i - 1].type === type) {
            // Si c'est la même, essaie de trouver une autre carte
            for (let j = i; j < typesToAssign.length; j++) {
                if (board[i - 1].type !== typesToAssign[j]) {
                    [typesToAssign[i], typesToAssign[j]] = [
                        typesToAssign[j],
                        typesToAssign[i],
                    ];
                    type = typesToAssign[i];
                    break;
                }
            }
        }
        board.push({
            id: i,
            type,
            highlight: false,
            visited: false,
            position: i,
            gridPosition: spiralOrder[i], // Position dans la grille 5*6
        });
    }

    // // Ajoute la case redevance fixe à la fin
    // board.push({
    //     id: 31,
    //     type: CARD_TYPES.REDEVANCE,
    //     highlight: false,
    //     visited: false,
    //     position: 31,
    //     gridPosition: spiralOrder[31], // Dernière position dans la spirale
    // });

    // Ajoute la case logo fixe à la fin
    board.push({
        id: 32,
        type: CARD_TYPES.LOGO,
        highlight: false,
        visited: false,
        position: 32,
        gridPosition: spiralOrder[32], // Dernière position dans la spirale
    });

    return board;
}

// Génère l'ordre de parcours en spirale pour une grille 5x4
function getSpiralOrder() {
    const rows = 6;
    const cols = 6;
    const spiral = [];

    // Parcours en spirale: extérieur vers intérieur
    // Commence en haut à gauche et va dans le sens horaire

    let top = 0,
        bottom = rows - 1;
    let left = 0,
        right = cols - 1;

    while (top <= bottom && left <= right) {
        // Parcourt la ligne du haut de gauche à droite
        for (let i = left; i <= right; i++) {
            spiral.push({ row: top, col: i });
        }
        top++;

        // Parcourt la colonne de droite de haut en bas
        for (let i = top; i <= bottom; i++) {
            spiral.push({ row: i, col: right });
        }
        right--;

        // Parcourt la ligne du bas de droite à gauche (si il reste des lignes)
        if (top <= bottom) {
            for (let i = right; i >= left; i--) {
                spiral.push({ row: bottom, col: i });
            }
            bottom--;
        }

        // Parcourt la colonne de gauche de bas en haut (si il reste des colonnes)
        if (left <= right) {
            for (let i = bottom; i >= top; i--) {
                spiral.push({ row: i, col: left });
            }
            left++;
        }
    }

    return spiral;
}

// Fonction pour mélanger un tableau
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// État initial du jeu
const INITIAL_GAME_STATE = {
    teams: {
        1: {
            name: "Équipe 1",
            score: 0,
            players: ["Pierre", "Francis", "Delphine"],
            color: "team1-color",
            active: true,
            position: 0,
            currentPlayer: 0, // New property to track the active player
        },
        2: {
            name: "Équipe 2",
            score: 0,
            players: ["Paul", "Ahmad", "Estelle"],
            color: "team2-color",
            active: true,
            position: 0,
            currentPlayer: 0,
        },
        3: {
            name: "Équipe 3",
            score: 0,
            players: [],
            color: "team3-color",
            active: false,
            position: 0,
            currentPlayer: 0,
        },
        4: {
            name: "Équipe 4",
            score: 0,
            players: [],
            color: "team4-color",
            active: false,
            position: 0,
            currentPlayer: 0,
        },
    },
    currentTurn: 1,
    activeTeam: 1,
    activeCard: null,
    dice: 1,
    gameTime: 30 * 60, // 30 minutes en secondes
    timerStarted: false, // Indique si le timer a été démarré
    gameBoard: generateInitialBoard(),
};
