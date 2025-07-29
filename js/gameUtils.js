/**
 * Fonctions utilitaires pour le jeu
 */

/**
 * Formate les secondes en format minutes:secondes (MM:SS)
 */
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Génère un nombre aléatoire entre min et max (inclus)
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Calcule la prochaine équipe active
 */
function getNextActiveTeam(currentTeam, teams) {
    const teamIds = Object.keys(teams).map(Number);
    const activeTeamIds = teamIds.filter(id => teams[id].active);
    
    if (activeTeamIds.length === 0) return currentTeam;
    
    const currentIndex = activeTeamIds.indexOf(currentTeam);
    const nextIndex = (currentIndex + 1) % activeTeamIds.length;
    
    return activeTeamIds[nextIndex];
}

/**
 * Mélange un tableau avec l'algorithme de Fisher-Yates
 */
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * Sélectionne une propriété aléatoire dans la liste des propriétés
 */
function getRandomProperty() {
    const randomIndex = getRandomInt(0, PROPERTIES.length - 1);
    return PROPERTIES[randomIndex];
}

/**
 * Génère une valeur aléatoire de bonus ou malus
 */
function getRandomBonus() {
    const amount = getRandomInt(1, 5) * 50;
    const isPositive = Math.random() > 0.3; // 70% de chance d'être positif
    return isPositive ? amount : -amount;
}