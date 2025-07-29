/**
 * Ce fichier contient toutes les données des cartes du jeu
 */

/**
 * Cartes Facture
 */
const FACTURES_CARDS = [
    {
        id: 1,
        title: "Facture de gaz",
        description: "",
        minAmount: -20,
        maxAmount: -40
    },
    {
        id: 2,
        title: "Facture d'eau",
        description: "",
        minAmount: -15,
        maxAmount: -30
    },
    {
        id: 3,
        title: "Facture d'électricité",
        description: "",
        minAmount: -25,
        maxAmount: -45
    },
    {
        id: 4,
        title: "Facture d'entretien",
        description: "",
        minAmount: -10,
        maxAmount: -35
    }
];

/**
 * Cartes PDB (Problèmes divers et besoins)
 */
const PDB_CARDS = [
    {
        id: 1,
        title: "Mouvement social avec dégradations",
        description: "La dernière réforme sur la dénomination pain au chocolat au lieu de chocolatine, ne passe pas !",
        minAmount: -2,
        maxAmount: -5,
        type: "cost"
    },
    {
        id: 2,
        title: "Mouvement social avec dégradations",
        description: "L'interdiction législative de consommer du chocolat au bureau embrase la foule en manque de magnésium",
        minAmount: -10,
        maxAmount: -20,
        type: "cost"
    },
    {
        id: 3,
        title: "Catastrophe naturelle",
        description: "L'Anainette (61), est sortie de son lit pour rejoindre la Fieffe (61) et a dévasté au passage le commissariat local !",
        minAmount: -40,
        maxAmount: -60,
        type: "cost"
    },
    {
        id: 4,
        title: "Travaux d'entretien",
        description: "Régis a confondu la marche avant et la marche arrière sur son véhicule électrique, il a embouti la barrière du site !",
        minAmount: -3,
        maxAmount: -8,
        type: "cost"
    },
    {
        id: 5,
        title: "Conditions climatiques",
        description: "La reine des neiges a instauré l'hiver en plein été, les radiateurs sont restés allumés 11 mois d'affilée !",
        minAmount: -40,
        maxAmount: -60,
        type: "cost"
    },
    {
        id: 6,
        title: "Revendications sociales",
        description: "Les employés réclament une meilleure qualité de vie au travail",
        minAmount: -10,
        maxAmount: -25,
        type: "cost"
    },
    {
        id: 7,
        title: "666",
        description: "Votre cession est minorée de 30%",
        effect: "reduction",
        value: -30,
        type: "special"
    },
    {
        id: 8,
        title: "Réajustement COT/COP",
        description: "Problème sanitaire qui impacte la qualité et la redevance",
        minAmount: -15,
        maxAmount: -35,
        type: "cost"
    },
    {
        id: 9,
        title: "Chat noir",
        description: "Votre prochaine cession est minorée de 10%",
        effect: "reduction",
        value: -10,
        type: "special"
    },
    {
        id: 10,
        title: "Conflit international",
        description: "Le torchon brûle entre la Normandie et la Bretagne au sujet du Mont Saint-Michel et de l'origine du cidre...",
        minAmount: -20,
        maxAmount: -40,
        type: "cost"
    },
    {
        id: 11,
        title: "Miroir cassé",
        description: "Cession minorée de 20%",
        effect: "reduction",
        value: -20,
        type: "special"
    },
    {
        id: 12,
        title: "Accident du quotidien",
        description: "Un incident imprévu qui coûte cher",
        minAmount: -5,
        maxAmount: -15,
        type: "cost"
    },
    {
        id: 13,
        title: "Augmentation de la dette publique",
        description: "L'État réduit ses dépenses immobilières",
        minAmount: -30,
        maxAmount: -50,
        type: "cost"
    },
    {
        id: 14,
        title: "Maux du bâtiment",
        description: "Des problèmes structurels nécessitent des réparations urgentes",
        minAmount: -20,
        maxAmount: -45,
        type: "cost"
    },
    {
        id: 15,
        title: "Évolution législative",
        description: "Nouvelles normes à respecter dans vos bâtiments",
        minAmount: -15,
        maxAmount: -35,
        type: "cost"
    },
    {
        id: 16,
        title: "Squat",
        description: "Votre bien a été occupé illégalement",
        minAmount: -10,
        maxAmount: -30,
        type: "cost"
    },
    {
        id: 17,
        title: "Vérification périodique",
        description: "Contrôle technique obligatoire des installations",
        minAmount: -5,
        maxAmount: -20,
        type: "cost"
    }
    // ,
    // {
    //     id: 18,
    //     title: "Faucheuse",
    //     description: "Prochaine cession annulée !",
    //     effect: "cancel_next",
    //     type: "special",
    //     minAmount: -5,
    //     maxAmount: -20,
    // }
];

/**
 * Cartes Bonus
 */
const BONUS_CARDS = [
    {
        id: 1,
        title: "Revalorisation COT/COP",
        description: "Revalorisation du barème",
        minAmount: 5,
        maxAmount: 15
    },
    {
        id: 2,
        title: "Densification",
        description: "Vous faites des travaux d'aménagement intérieur et regroupez votre annexe avec votre site principal. Ah qu'est-ce qu'on est serré au fond de cette boîte !",
        minAmount: 80,
        maxAmount: 120
    },
    {
        id: 3,
        title: "Investissement",
        description: "Placement judicieux qui rapporte des dividendes",
        minAmount: 20,
        maxAmount: 40
    },
    {
        id: 4,
        title: "Travaux de rénovation énergétique",
        description: "Économies réalisées grâce à l'amélioration de l'efficacité énergétique",
        minAmount: 15,
        maxAmount: 35
    },
    {
        id: 5,
        title: "Anticipation des conventions à renouveler",
        description: "Vous avez prévu à l'avance et négocié de meilleures conditions",
        minAmount: 10,
        maxAmount: 30
    },
    {
        id: 6,
        title: "Contrôle de CDU",
        description: "Vérification des conditions d'utilisation qui révèle des opportunités",
        minAmount: 5,
        maxAmount: 25
    },
    {
        id: 7,
        title: "Super Gold",
        description: "Bénéfice de réduction sur vos charges",
        minAmount: 30,
        maxAmount: 50
    },
    {
        id: 8,
        title: "Optimisation des surfaces",
        description: "Votre site est sinistré mais vous êtes né sous une bonne étoile, vous êtes relogé temporairement dans un site domanial ! Vous n'avez plus de loyer au prochain tour.",
        effect: "no_rent",
        type: "special"
    },
    {
        id: 9,
        title: "Patte de lapin",
        description: "Cession majorée de 10%",
        effect: "increase",
        minAmount: 20,
        maxAmount: 30,
        type: "special"
    },
    {
        id: 10,
        title: "Redevances",
        description: "Rentrées supplémentaires grâce aux redevances",
        minAmount: 20,
        maxAmount: 40
    },
    {
        id: 11,
        title: "Conditions climatiques",
        description: "Économies réalisées grâce à un climat favorable",
        minAmount: 10,
        maxAmount: 25
    },
    {
        id: 12,
        title: "Organisation",
        description: "Améliorations dans la gestion qui rapportent des économies",
        minAmount: 15,
        maxAmount: 30
    },
    {
        id: 13,
        title: "Grigri africain",
        description: "Cession majorée de 30%",
        effect: "increase",
        minAmount: 20,
        maxAmount: 40,
        type: "special"
    },
    {
        id: 14,
        title: "Trèfle à 4 feuilles",
        description: "Cession majorée de 20%",
        effect: "increase",
        minAmount: 20,
        maxAmount: 20,
        type: "special"
    },
    {
        id: 15,
        title: "Renégociation de bail",
        description: "Vous avez obtenu de meilleures conditions",
        minAmount: 5,
        maxAmount: 15
    }
];
const REDEVANCE_CARDS =[
    {
        id: 1,
        title: "Redevance annuelle",
        description: "Encaissement de la redevance annuelle.",
        minAmount: 20,
        maxAmount: 70
    }
]

/**
 * Cartes Biens
 */
const BIENS_CARDS = [
    {
        id: 1,
        title: "Délaissé routier",
        description: "Bande de terre de 800m² située le long de l'A13",
        minAmount: 20,
        maxAmount: 40
    },
    {
        id: 2,
        title: "Bien d'exception",
        description: "Belle bâtisse, classée aux monuments historiques",
        minAmount: 50,
        maxAmount: 120 
   },
    {
        id: 3,
        title: "Bien atypique",
        description: "Maison d'arrêt désaffectée",
        minAmount: 100,
        maxAmount: 300
    
    },
    {
        id: 4,
        title: "Maison forestière",
        description: "Charmante maison non meublée",
        minAmount: 100,
        maxAmount: 300
    },
    {
        id: 5,
        title: "Maison de gardien",
        description: "Pavillon sans prétention",
        minAmount: 100,
        maxAmount: 200
        },
    {
        id: 6,
        title: "Maison de directeur",
        description: "Petite maison de maître",
        minAmount: 70,
        maxAmount: 110
        },
    {
        id: 7,
        title: "Bien vacant sans maître",
        description: "Tas de cailloux dangereux",
       minAmount: 1,
        maxAmount: 3
    
    },
    {
        id: 8,
        title: "Bien vacant sans maître",
        description: "Maison abandonnée",
        minAmount: 30,
        maxAmount: 70
    
    },
    {
        id: 9,
        title: "Bien vacant sans maître",
        description: "Terrain en friche avec potentiel",
        minAmount: 20,
        maxAmount: 70
    
    }
];

/**
 * Cartes Interaction
 */
const INTERACTION_CARDS = [
    {
        id: 1,
        title: "Augmentation de la dette publique",
        description: "Suite au mouvement des cagoules jaunes le gouvernement instaure un plan de restrictions budgétaires !",
        amount: 200,
        type: "cost"
    },
    {
        id: 2,
        title: "Nettoyage de printemps",
        description: "Grand ménage dans les biens immobiliers",
        minAmount: 10,
        maxAmount: 30,
        type: "cost"
    },
    {
        id: 3,
        title: "Achat compulsif",
        description: "Acquisition non planifiée qui pèse sur le budget",
        minAmount: 20,
        maxAmount: 40,
        type: "cost"
    },
    {
        id: 4,
        title: "Bouclier tarifaire -10%",
        description: "CHOISISSEZ UNE ÉQUIPE QUI VERRA SA PROCHAINE FACTURE DIMINUER DE -10% grâce au bouclier tarifaire mis en œuvre par le gouvernement.",
        effect: "team_reduction",
        value: 10,
        type: "team_effect"
    },
    {
        id: 5,
        title: "Hausse énergétique +10%",
        description: "CHOISISSEZ UNE ÉQUIPE QUI VERRA SA PROCHAINE FACTURE AUGMENTER DE +10% À CAUSE DE LA HAUSSE DU PRIX D'ACHAT DE L'ÉNERGIE.",
        effect: "team_increase",
        value: 10,
        type: "team_effect"
    },
    {
        id: 6,
        title: "Bouclier tarifaire -30%",
        description: "CHOISISSEZ UNE ÉQUIPE QUI VERRA SA PROCHAINE FACTURE DIMINUER DE -30% grâce au bouclier tarifaire mis en œuvre par le gouvernement.",
        effect: "team_reduction",
        value: 30,
        type: "team_effect"
    },
    {
        id: 7,
        title: "Hausse énergétique +10%",
        description: "CHOISISSEZ UNE ÉQUIPE QUI VERRA SA PROCHAINE FACTURE AUGMENTER DE +10% À CAUSE DE LA HAUSSE DU PRIX D'ACHAT DE L'ÉNERGIE.",
        effect: "team_increase",
        value: 10,
        type: "team_effect"
    },
    {
        id: 8,
        title: "Bouclier tarifaire -20%",
        description: "CHOISISSEZ UNE ÉQUIPE QUI VERRA SA PROCHAINE FACTURE DIMINUER DE -20% grâce au bouclier tarifaire mis en œuvre par le gouvernement.",
        effect: "team_reduction",
        value: 20,
        type: "team_effect"
    },
    {
        id: 9,
        title: "Hausse énergétique +20%",
        description: "CHOISISSEZ UNE ÉQUIPE QUI VERRA SA PROCHAINE FACTURE AUGMENTER DE +20% À CAUSE DE LA HAUSSE DU PRIX D'ACHAT DE L'ÉNERGIE.",
        effect: "team_increase",
        value: 20,
        type: "team_effect"
    },
    {
        id: 10,
        title: "Bouclier tarifaire -30%",
        description: "CHOISISSEZ UNE ÉQUIPE QUI VERRA SA PROCHAINE FACTURE DIMINUER DE -30% grâce au bouclier tarifaire mis en œuvre par le gouvernement.",
        effect: "team_reduction",
        value: 30,
        type: "team_effect"
    },
    {
        id: 11,
        title: "Hausse énergétique +50%",
        description: "CHOISISSEZ UNE ÉQUIPE QUI VERRA SA PROCHAINE FACTURE AUGMENTER DE +50% À CAUSE DE LA HAUSSE DU PRIX D'ACHAT DE L'ÉNERGIE.",
        effect: "team_increase",
        value: 50,
        type: "team_effect"
    }
];

/**
 * Génère un montant aléatoire entre min et max
 */
function getRandomAmount(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Retourne une carte aléatoire du type spécifié
 */
function getRandomCard(cardType) {
    let cards;
    switch (cardType) {
        case 'facture':
            cards = FACTURES_CARDS;
            break;
        case 'pdb':
            cards = PDB_CARDS;
            break;
        case 'bonus':
            cards = BONUS_CARDS;
            break;
        case 'biens':
            cards = BIENS_CARDS;
            break;
        case 'interaction':
            cards = INTERACTION_CARDS;
            break;
        case 'redevance':
            cards = REDEVANCE_CARDS;
            break;
        default:
            return null;
    }
    
    if (cards.length === 0) {
        console.error(`Le tableau de cartes ${cardType} est vide`);
        return null;
    }
    
    const randomIndex = Math.floor(Math.random() * cards.length);
    const card = { ...cards[randomIndex] };
    
    // Générer un montant aléatoire pour les cartes qui en ont besoin
    if (card.minAmount !== undefined && card.maxAmount !== undefined) {
        card.amount = getRandomAmount(card.minAmount, card.maxAmount);
    }
    
    return card;
}