/**
 * Ce fichier gère l'animation de retournement des cartes directement sur les modals
 */

// Tableau de correspondance entre les types de carte et les IDs des modals
const CARD_MODAL_MAP = {
    property: "property-modal",
    bonus: "bonus-modal",
    facture: "facture-modal",
    biens: "biens-modal",
    pdb: "pdb-modal",
    interaction: "interaction-modal",
    redevance: "redevance-modal"
};
/**
 * Lit le contenu de la carte à haute voix, y compris le nom, la description et d'autres détails
 * @param {Object} card - L'objet carte complet (e.g., { title, description, amount, effect })
 * @param {String} cardType - Le type de carte ('bonus', 'facture', etc.)
 */
function readCardContent(card, cardType) {
     if (!card) {
        console.error("Aucune carte fournie pour la lecture. Utilisation d'un message par défaut.");
        const defaultText = `Aucune carte disponible pour ${cardTypeToName(cardType)}.`;
        speakText(defaultText);  // Utilisez une fonction pour lire le texte
        return;
    }
    

    
    // Construire le texte complet à lire
    let speechText = `Carte  ${cardTypeToName(cardType)}. `;
    speechText += `${card.title || 'Non spécifié'}. `;
    
    if(cardTypeToName(cardType) === "Interaction"){

    
        if (card.description) {
            speechText += ` ${card.description}. `;
        }
    }else{
            if (card.effect === "increase") {
            speechText += ` ${card.description}. `;
             
                speechText += `+${card.amount}% sur votre prochaine transaction`;

            }else if(card.effect ==="no_rent"){

            speechText += ` ${card.description}. `;
            
            speechText += "Pas de loyer au prochain tour";
            
        }else{

          
        if (card.description) {
            speechText += ` ${card.description}. `;
        }
        if (card.amount) {
            speechText += `Montant : ${card.amount} K. `;
        } else if (card.effect) {
            speechText += `Effet spécial : ${card.effect} avec valeur ${card.amount || 'non spécifiée'}. `;
        } else {
            speechText += `Aucun montant ou effet spécifié. `;
        }  
        }



    }

  const voices = speechSynthesis.getVoices();
    maleVoice = voices.find(voice => voice.name === "Microsoft Paul - French (France)");

    const speech = new SpeechSynthesisUtterance(speechText);
    speech.lang = 'fr-FR';  // Langue française
    speech.volume = 1;     // Volume maximum
    speech.rate = 1;       // Vitesse normale
    speech.pitch = 1;      // Ton normal
  if (maleVoice) {
            speech.voice = maleVoice;
            
        }

    // Lire le texte
    window.speechSynthesis.speak(speech);
}

/**
 * Convertit un modal standard en une carte flip et l'affiche
 * @param {string} cardType - Le type de carte ('bonus', 'facture', etc.)
 * @param {Object} card - L'objet carte complet pour lire le contenu
 * @param {Function} onFlipComplete - Callback exécuté une fois que la carte est retournée
 */
function showFlipCardModal(cardType, card) {
    console.log(`Tentative d'affichage de la carte pour le type: ${cardType}`, card);

    // Récupère l'ID du modal correspondant au type de carte
    const modalId = CARD_MODAL_MAP[cardType.toLowerCase()];
    if (!modalId) {
        console.error(`Aucune carte valide fournie pour le type ${cardType}. Utilisation d'une carte par défaut ou annulation.`);
        return;
    }

    // Récupère l'élément du modal
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`Modal element not found: ${modalId}`);
        return;
    }

    console.log(`Found modal: ${modalId}`);

    // Ajoute les classes pour transformer le modal en carte flip
    modal.classList.add("card-modal");
    modal.classList.add(cardType.toLowerCase());

    // Récupère le contenu du modal existant
    const modalContent = modal.querySelector(".modal-content");

    console.log(`Modal content found:`, modalContent);

    // Crée une copie du contenu existant pour la face arrière
    const cardBack = document.createElement("div");
    cardBack.className = "card-back";

    // Déplace tous les enfants du contenu du modal dans la face arrière
    while (modalContent.firstChild) {
        cardBack.appendChild(modalContent.firstChild);
    }

    // Crée la face avant de la carte avec icône personnalisée
    const cardFront = document.createElement("div");
    cardFront.className = "card-front";

    // Ajoute l'icône personnalisée au recto en fonction du type de carte
    const cardFrontIcon = document.createElement("div");
    cardFrontIcon.className = "card-front-icon"; // Classe pour styliser en CSS

    switch (cardType.toLowerCase()) {
        case "bonus":
            cardFrontIcon.innerHTML = `
               <svg viewBox="0 0 1024 1024" class="icon" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M902.3 517.4l-3.2 4.9c-0.6 1-63.7 96.2-145 209.5-62.8 87.5-135.9 99.1-170.5 99.1-11.6 0-18.9-1.3-20.1-1.5H356l-14.5-14.3h223.4c5.4 0.9 99.1 17.3 177.5-91.7 70.5-98.1 127-182.5 141.2-203.8-10.2-8.3-43-35.2-74.6-30.1-10.2 1.7-25.6 13.2-42.5 29.9l-2.3-2.3v-16.9c16.2-13.8 31.3-23.1 42.6-24.9 47.3-7.7 89.6 36.4 91.2 38l4.3 4.1z" fill="#C9971C"></path><path d="M883.6 519.6c-14.2 21.4-70.7 105.8-141.2 203.8-78.4 109-172.1 92.6-177.5 91.7H341.5L186.8 661.9C200.6 638.4 274 530.7 440 582c7.5 6.3 44.5 31.2 130.8 11.3 11.6-2.7 21.7-3.8 30.6-3.8 26.7 0 41.6 10.5 49.6 20.8 13.7 17.4 13.7 41.3 6.8 55.1-14.1 28.1-37.5 40.6-75.8 40.6H454.5v14.3H582c44 0 72.1-15.5 88.7-48.6 3.2-6.5 5.2-14.8 5.6-23.7l0.1 0.3c13.4-36.6 55-94 90.2-128.9 16.9-16.8 32.2-28.3 42.5-29.9 31.5-5.1 64.3 21.7 74.5 30.1z" fill="#FFF0C2"></path><path d="M796.5 265.2v75.6c0 16.4-13.3 29.7-29.7 29.7h-2.6v129.8c-4.5 4-9.1 8.2-13.8 12.7V370.5H605.1v204.9c-5-0.3-10.4-0.1-16.1 0.5V252.5c-1.4 0-2.6 0.1-4 0.1-11 0-22.6-0.4-34.9-1H546.6c-4.9 0.3-9.5 0.4-14.1 0.6v332.9c-5.8 0.6-11.1 1-16.1 1.2V370.5H367v183.9c-4.7-0.4-9.3-0.4-13.8-0.4V370.5h-6.5c-16.4 0-29.8-13.3-29.8-29.7v-75.6c0-16.4 13.4-29.7 29.8-29.7h66.5c-11.5-6.1-20.1-13.6-25.3-22.8-15.9-28.1 4.7-58.8 5.6-60.1 14.8-18 31.5-25.8 50-23.7 47.1 5.2 90.5 75.8 104.9 101.5 14.5-25.7 57.9-96.3 105-101.5 18.4-2.2 35.2 5.6 49.6 23 1.3 1.9 21.9 32.6 6 60.7-5.2 9.2-13.8 16.6-25.3 22.8h83.2c16.3 0.1 29.6 13.4 29.6 29.8z m-16.1 75.6v-75.6c0-7.5-6.1-13.6-13.6-13.6H614.3c-3.1 0.1-6 0.4-9.2 0.5v102.2h161.8c7.4 0 13.5-6 13.5-13.5zM694.9 205c11-19.4-4.7-43-4.9-43.2-10.5-12.5-22.1-18.3-34.9-16.8-34.8 3.8-73 58.8-91 90.5H616c51.2-3.9 71.6-17.7 78.9-30.5z m-214.5 30.5h52.2c-18-31.7-56.1-86.7-90.9-90.5-12.9-1.4-24.6 4.2-35.4 17.4 0.1 0-15.2 23.3-4.3 42.6 7.2 12.6 27.3 26.6 78.4 30.5z m36.1 118.8V252.7h-4.7c-10.5 0-20.1-0.4-29.3-1H346.7c-7.5 0-13.6 6-13.6 13.6v75.6c0 7.5 6 13.6 13.6 13.6h169.8z" fill="#EF4666"></path><path d="M780.4 265.2v75.6c0 7.5-6.1 13.6-13.6 13.6H605.1V252.2c3.2-0.1 6.1-0.4 9.2-0.5h152.6c7.4 0 13.5 6 13.5 13.5z" fill="#FFF0C2"></path><path d="M764.3 517.1l2.3 2.3c-35.2 34.9-76.7 92.3-90.2 128.9l-0.1-0.3c0.6-8.6-0.4-17.9-3.5-26.9 15.1-36.2 46.8-78.5 77.6-108.3v10.9l8.4-6.6h5.5z" fill="#C9971C"></path><path d="M764.3 500.2v16.9h-5.4l-8.4 6.6v-10.9c4.7-4.4 9.3-8.6 13.8-12.6z" fill="#C9971C"></path><path d="M750.5 370.5V513c-30.8 29.8-62.5 72.1-77.6 108.3-2.3-6.9-5.8-13.7-10.6-19.8-8.2-10.4-25.2-24.9-57.2-26.1V370.5h145.4z" fill="#FFE085"></path><path d="M690 161.8c0.1 0.3 15.9 23.8 4.9 43.2-7.3 12.8-27.6 26.6-78.9 30.6h-52c18-31.7 56.3-86.7 91-90.5 12.9-1.6 24.5 4.1 35 16.7z" fill="#F59A9B"></path><path d="M672.9 621.2c3.1 9 4.1 18.3 3.5 26.9l-6.1-20.1c0.7-2.2 1.5-4.5 2.6-6.8z" fill="#C9971C"></path><path d="M670.2 628l6.1 20.1c-0.4 8.8-2.4 17.1-5.6 23.7-16.6 33.1-44.8 48.6-88.7 48.6H454.5V706H582c38.4 0 61.8-12.5 75.8-40.7 6.9-13.8 6.9-37.7-6.8-55.1-8.1-10.4-22.9-20.8-49.6-20.8v-4h3.7v-10.1c32 1.2 49 15.7 57.2 26.1 4.9 6.1 8.3 12.9 10.6 19.8-1.1 2.3-1.9 4.6-2.7 6.8z" fill="#C9971C"></path><path d="M605.1 575.3v10.1h-3.7l-12.4 0.3v-9.8c5.7-0.7 11.1-0.8 16.1-0.6z" fill="#C9971C"></path><path d="M601.4 585.4v4c-8.8 0-18.9 1.2-30.6 3.8-86.3 19.9-123.3-5-130.8-11.3-166-51.3-239.4 56.4-253.2 79.9l-10.4-10.4c15.5-24.9 69.4-96.5 176.7-97.6v6.1H367v-5.8c23.7 0.9 49.9 5.5 78.6 14.5l1.7 0.5 1.3 1.2c0.3 0.3 19.1 17.4 67.9 15.9v5h5l11.1-0.1v-6c10.5-1 22.1-2.9 35-5.9 7.7-1.7 14.8-2.8 21.4-3.5v9.8l12.4-0.1z" fill="#C9971C"></path><path d="M589 252.5v323.3c-6.5 0.6-13.7 1.8-21.4 3.5-12.9 2.9-24.6 4.9-35 5.9V252.3c4.6-0.3 9.2-0.4 14.1-0.6H550.2c12.3 0.6 23.9 1 34.9 1 1.3 0 2.5-0.2 3.9-0.2z" fill="#F59A9B"></path><path d="M532.6 585.2v6l-11.1 0.1h-5v-5c5-0.1 10.3-0.5 16.1-1.1z" fill="#C9971C"></path><path d="M532.6 235.5h-52.2c-51.2-4-71.2-17.9-78.5-30.6-10.9-19.3 4.5-42.6 4.3-42.6 10.9-13.2 22.5-18.8 35.4-17.4 34.9 3.9 73 58.9 91 90.6z" fill="#F59A9B"></path><path d="M516.5 370.5v215.9c-48.8 1.5-67.6-15.6-67.9-15.9l-1.3-1.2-1.7-0.5c-28.8-9-55-13.6-78.6-14.5V370.5h149.5z" fill="#FFE085"></path><path d="M516.5 252.7v101.7H346.7c-7.5 0-13.6-6-13.6-13.6v-75.6c0-7.5 6-13.6 13.6-13.6h135.8c9.2 0.6 18.8 1 29.3 1 1.5 0.1 3.1 0.1 4.7 0.1z" fill="#FFF0C2"></path><path d="M367 554.3v5.8h-13.8V554c4.5 0 9.1 0 13.8 0.3zM360.6 834c19.2 19.1 19.4 50.3 0.3 69.4l-21.6 21.9c-9.2 9.3-21.5 14.5-34.7 14.5h-0.3c-13 0-25.3-5-34.5-14.1L72.5 730.3C63.3 721 58 708.7 58 695.5s5-25.4 14.2-34.8l21.6-21.9c9.2-9.2 21.5-14.5 34.7-14.5h0.3c13 0 25.3 5 34.7 14.2l13 12.9c-3.2 5.1-4.7 8.3-4.9 8.6l12.8 6.1c0.1-0.1 0.9-1.7 2.4-4.3L341.5 815H334v12.7l-180.7-179c-6.5-6.4-15.2-10-24.6-10h-0.1c-9.3 0-18.2 3.7-24.7 10.2l-21.6 21.9c-6.5 6.5-10 15.3-10 24.7 0 9.3 3.7 18 10.2 24.6l197.3 195.4c6.5 6.5 15.2 10.1 24.4 10.1h0.3c9.3-0.1 18-3.7 24.6-10.4l21.6-21.7c13.6-13.7 13.4-35.8-0.3-49.4l-14.8-14.7H356l4.6 4.6z" fill="#C9971C"></path><path d="M356 829.4h-20.3l-1.7-1.7v-12.6h7.5z" fill="#C9971C"></path><path d="M350.5 844.1c13.7 13.6 13.8 35.7 0.3 49.4l-21.6 21.7c-6.5 6.6-15.2 10.2-24.6 10.4h-0.3c-9.2 0-17.9-3.6-24.4-10.1L82.6 720.1c-6.5-6.5-10.2-15.2-10.2-24.6 0-9.3 3.5-18.2 10-24.7l21.6-21.9c6.5-6.5 15.3-10.2 24.7-10.2h0.1c9.3 0 18 3.6 24.6 10l180.7 179v1.7h1.7l14.7 14.7z" fill="#C9971C"></path><path d="M335.7 829.4H334v-1.7zM176.4 651.5l10.4 10.4c-1.5 2.7-2.3 4.2-2.4 4.3l-12.8-6.1c0.1-0.3 1.7-3.5 4.8-8.6z" fill="#C9971C"></path></g></svg>
            `;
            break;
        case "facture":
            cardFrontIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" viewBox="0 0 448 448" xml:space="preserve">                       <rect x="99" y="275" style="fill:#7AC943;" width="154" height="26"/>                        <path style="fill:#FFF8EF;" d="M43,51v363.9l52.3-55.2l0.1-0.1c0.3-0.1,0.8-0.2,1.4-0.2c0.4,0,1.4,0.3,2,0.9l53.9,59l54.4-33.7  l0.4-0.4c0,0,0.1-0.1,0.4-0.1c0.6,0,1.4,0.3,2,0.6l45.5,33.2l38-50c0.6-0.6,1.5-1.5,1.8-1.5h0.8c0.9,0,1.3,0.1,2.1,0.9l62.2,59.7  l44.7-50.1V51H43z M93,101h158v6H93V101z M93,157h158v6H93V157z M93,213h158v6H93V213z M259,304c0,1.2-1.8,3-3,3H96c-2,0-3-1.8-3-3  v-32c0-1.2,1-3,3-3h160c1.2,0,3,1.8,3,3V304z M363,267h-40v18h37c1.2,0,3,1.8,3,3v24c0,1.2-1.8,3-3,3h-13v8h-6v-8h-24v-6h40v-18h-37  c-1.2,0-3-1.8-3-3v-24c0-1.2,1.8-3,3-3h21v-8h6v8h16V267z M371,219h-70v-6h70V219z M371,163h-70v-6h70V163z M371,107h-70v-6h70V107z  "/>                        <path style="fill:#996632;" d="M11,19v58h26V48c0-2,1-3,3-3h368c1.2,0,3,1,3,3v29h26V19H11z"/>                        <g>                            <path style="fill:#E0CBB5;" d="M296,354.4L256,408l-31.2-37.6c-4.8-5.6-13.6-6.4-19.2-1.6l-42.4,37.6l40.8-25.6   c2.4-1.6,6.4-1.6,8.8,0l41.6,30.4l35.2-46.4c1.6-1.6,3.2-3.2,5.6-3.2h0.8c2.4,0,4,0.8,5.6,2.4l52,49.6l-41.6-60   C308,349.6,300,348.8,296,354.4z"/>                            <path style="fill:#E0CBB5;" d="M90.4,356c1.6-1.6,4-2.4,5.6-2.4c1.6,0,4,0.8,5.6,2.4l34.4,37.6l-31.2-44.8   c-4.8-7.2-15.2-8.8-22.4-3.2L64,360L48,56v346.4L90.4,356z"/>                        </g>                        <path style="fill:#42210B;" d="M296,208h80v16h-80V208z M296,152h80v16h-80V152z M296,96h80v16h-80V96z M368,288v24c0,4-4,8-8,8h-8  v8h-16v-8h-24v-16h40v-8h-32c-4,0-8-4-8-8v-24c0-4,4-8,8-8h16v-8h16v8h16v16h-40v8h32C364,280,368,284,368,288z M88,208h168v16H88  V208z M88,152h168v16H88V152z M88,96h168v16H88V96z M96,264h160c4,0,8,4,8,8v32c0,4-4,8-8,8H96c-4.8,0-8-4-8-8v-32  C88,268,91.2,264,96,264z M248,296v-16H104v16H248z M40,40h368c4,0,8,3.2,8,8v24h16V24H16v48h16V48C32,43.2,35.2,40,40,40z   M254.4,411.2l35.2-46.4c1.6-1.6,3.2-3.2,5.6-3.2h0.8c2.4,0,4,0.8,5.6,2.4l58.4,56l40-44.8V56H48v346.4l42.4-45.6  c1.6-1.6,4-2.4,5.6-2.4c2.4,0,4,0.8,5.6,2.4l51.2,56l50.4-31.2c3.2-1.6,6.4-1.6,8.8,0L254.4,411.2z M0,80V16c0-4.8,3.2-8,8-8h432  c4,0,8,3.2,8,8v64c0,4-4,8-8,8h-24v291.2c0,2.4-0.8,4-2.4,5.6l-48,52.8c-0.8,1.6-3.2,2.4-5.6,2.4l0,0c-2.4,0-4-0.8-5.6-2.4  l-57.6-55.2l-34.4,44.8c-2.4,3.2-7.2,4-11.2,1.6l-44-32l-51.2,32c-3.2,2.4-7.2,1.6-10.4-1.6L96,373.6L45.6,428  c-2.4,2.4-5.6,3.2-8.8,2.4c-2.4-1.6-4.8-4.8-4.8-8V88H8C3.2,88,0,84,0,80z"/>                       </svg>
            `;
            break;
        case "interaction":
            cardFrontIcon.innerHTML = `
              <svg  viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect width="48" height="48" fill="url(#pattern0_61_255)"/><defs><pattern id="pattern0_61_255" patternContentUnits="objectBoundingBox" width="1" height="1"><use xlink:href="#image0_61_255" transform="scale(0.0078125)"/></pattern>+<image id="image0_61_255" width="128" height="128" preserveAspectRatio="none" xlink:href="data:image/png;base64,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"/></defs></svg>
           `;
            break;

        case "biens":
            cardFrontIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 486 511.942">
                    <path fill-rule="nonzero" d="M269.863 203.715v249.556h135.206c3.748 0 7.138 1.537 9.579 3.978a13.552 13.552 0 013.982 9.582v31.55c0 3.693-1.552 7.092-4.008 9.554l.021.02c-2.445 2.445-5.85 3.987-9.574 3.987H83.853c-3.669 0-7.066-1.524-9.54-3.983l-.042-.042c-2.444-2.46-3.979-5.829-3.979-9.536v-31.55c0-3.738 1.523-7.131 3.976-9.584a13.523 13.523 0 019.585-3.976h135.249l.001-249.364a54.7 54.7 0 01-13.567-9.9 55.038 55.038 0 01-9.944-13.549h-74.523v3.279c0 3.738-1.524 7.131-3.977 9.584a13.525 13.525 0 01-9.584 3.976h-3.696l51.539 121.755h33.524v10.755c0 26.075-10.572 49.685-27.662 66.775-17.09 17.09-40.7 27.663-66.776 27.663-26.075 0-49.685-10.573-66.775-27.663C10.571 379.492 0 355.882 0 329.807v-10.755H33.614l52.978-121.755h-2.765a13.528 13.528 0 01-9.586-3.976 13.529 13.529 0 01-3.976-9.584v-3.279H57.553a14.313 14.313 0 01-9.28-3.429c-2.928-2.509-4.74-6.092-4.74-10.131v-23.682c0-4.042 1.815-7.621 4.74-10.132a14.308 14.308 0 019.28-3.43h138.182a55.124 55.124 0 0116.966-19.301c8.942-6.307 19.832-10.013 31.563-10.013 11.732 0 22.62 3.706 31.563 10.013a55.134 55.134 0 0116.966 19.301h138.576c3.524 0 6.817 1.314 9.28 3.43 2.926 2.511 4.741 6.09 4.741 10.132v23.682c0 4.039-1.813 7.622-4.741 10.131a14.304 14.304 0 01-9.28 3.429h-15.712v3.279c0 3.738-1.524 7.131-3.976 9.584a13.531 13.531 0 01-9.585 3.976h-1.16l51.54 121.755H486v10.755c0 26.075-10.573 49.685-27.663 66.775-17.089 17.09-40.7 27.663-66.775 27.663-26.076 0-49.686-10.573-66.775-27.663-17.091-17.09-27.663-40.7-27.663-66.775v-10.755h33.615l52.977-121.755h-5.301a13.528 13.528 0 01-9.586-3.976 13.529 13.529 0 01-3.976-9.584v-3.279h-71.915a55.214 55.214 0 01-23.075 23.257zm74.241 115.337h95.079l-46.885-110.761-48.194 110.761zm-297.124 0h95.079L95.174 208.291 46.98 319.052z"/>
                    <path fill="#FFE27B" d="M259.108 196.743v267.282h145.961c1.543 0 2.806 1.286 2.806 2.806v31.55c0 1.516-1.29 2.806-2.806 2.806H83.853c-1.516 0-2.806-1.262-2.806-2.806v-31.55a2.815 2.815 0 012.806-2.806h145.961l.001-267.143c-12.717-4.409-22.792-14.469-27.215-27.179h-92.286v14.034a2.814 2.814 0 01-2.806 2.805H83.827a2.815 2.815 0 01-2.807-2.805v-14.034H57.553c-1.796 0-3.265-1.262-3.265-2.805v-23.682c0-1.544 1.469-2.807 3.265-2.807h145.151c6.081-17.081 22.391-29.314 41.56-29.314 19.168 0 35.479 12.233 41.561 29.314h145.544c1.797 0 3.266 1.263 3.266 2.807v23.682c0 1.543-1.469 2.805-3.266 2.805h-26.467v14.034a2.814 2.814 0 01-2.806 2.805h-23.681a2.814 2.814 0 01-2.807-2.805v-14.034h-89.677c-4.378 12.578-14.291 22.562-26.823 27.04z"/>
                    <path fill-rule="nonzero" d="M244.264 125.225c16.524 0 29.977 13.472 29.977 29.977 0 16.531-13.461 29.975-29.977 29.975-8.275 0-15.77-3.357-21.194-8.781-5.424-5.425-8.782-12.92-8.782-21.194 0-8.275 3.358-15.771 8.782-21.195 5.424-5.425 12.919-8.782 21.194-8.782z"/>
                    <path fill="#EA542B" d="M244.264 135.98c10.615 0 19.222 8.606 19.222 19.222 0 10.614-8.607 19.221-19.222 19.221-10.616 0-19.221-8.607-19.221-19.221 0-10.616 8.605-19.222 19.221-19.222z"/>
                    <path fill="#FFC54A" d="M94.437 329.807H10.755c0 46.217 37.466 83.683 83.682 83.683 46.217 0 83.683-37.466 83.683-83.683H94.437zM391.562 329.807h-83.683c0 46.217 37.466 83.683 83.683 83.683 46.217 0 83.683-37.466 83.683-83.683h-83.683z"/>
                    <path fill="#FE3150" d="M391.563 0c30.752 0 55.678 24.927 55.678 55.678 0 30.749-24.926 55.677-55.678 55.677-30.75.002-55.678-24.926-55.678-55.677C335.885 24.926 360.813 0 391.563 0z"/>
                    <path fill="#fff" d="M405.083 33.134a6.155 6.155 0 018.767-.023c2.426 2.437 2.436 6.402.024 8.852l-13.567 13.72 13.577 13.73c2.396 2.432 2.361 6.37-.07 8.798-2.434 2.428-6.347 2.421-8.74-.011l-13.507-13.655-13.526 13.676a6.153 6.153 0 01-8.766.024c-2.426-2.437-2.438-6.402-.024-8.852l13.567-13.72-13.578-13.729c-2.395-2.431-2.361-6.37.072-8.799 2.433-2.428 6.346-2.421 8.738.011l13.508 13.657 13.525-13.679z"/>
                    <path fill="#68D166" d="M94.439.006c30.747 0 55.671 24.924 55.671 55.67 0 30.747-24.924 55.671-55.671 55.671S38.768 86.423 38.768 55.676c0-30.746 24.924-55.67 55.671-55.67z"/>
                    <path fill="#fff" d="M65.747 58.451c.819-4.748 6.24-7.392 10.516-4.82.389.232.759.507 1.103.822l.033.031c1.92 1.839 4.07 3.753 6.202 5.651l1.828 1.642 25.07-26.132c1.297-1.357 2.244-2.234 4.189-2.673 6.659-1.468 11.339 6.671 6.62 11.645L90.893 76.37c-2.547 2.717-7.1 2.965-9.838.37-1.57-1.458-3.277-2.94-5.002-4.436-2.989-2.598-6.037-5.247-8.523-7.87-1.491-1.49-2.135-3.931-1.783-5.983z"/>
                </svg>
            `;
            break;
        case "pdb":
            cardFrontIcon.innerHTML = `
              <svg  viewBox="0 0 69 42" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><rect width="68.88" height="42" fill="url(#pattern0_70_524)"/><defs><pattern id="pattern0_70_524" patternContentUnits="objectBoundingBox" width="1" height="1"><use xlink:href="#image0_70_524" transform="matrix(0.0184832 0 0 0.0303125 -0.097561 -0.42)"/></pattern><image id="image0_70_524" width="64" height="64" preserveAspectRatio="none" xlink:href="data:image/png;base64,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"/></defs></svg>
            `;
            break;
        case "redevance":
            cardFrontIcon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  version="1.1" id="Layer_1" viewBox="0 0 512 512" xml:space="preserve">
            <polygon style="fill:#F2B851;" points="59.52,512 59.52,212.4 256,70.912 452.48,212.4 452.48,512 "/>
            <path style="fill:#FFFFFF;" d="M336.768,417.664c-10.784,6.016-29.184,12.048-49.504,12.048c-31.104,0-59.664-12.688-77.456-36.176  c-8.56-10.8-14.912-24.432-17.76-41.264h-20.624v-22.528h17.456c0-1.6,0-3.488,0-5.392c0-3.168,0.32-6.352,0.32-9.536h-17.76  v-22.528h21.248c4.144-17.136,11.744-31.728,21.904-43.472c18.096-20.32,43.488-32.368,73.312-32.368  c19.36,0,36.192,4.448,47.616,9.52l-8.896,36.176c-8.256-3.488-21.264-7.616-35.216-7.616c-15.232,0-29.2,5.072-39.04,17.136  c-4.432,5.072-7.936,12.368-10.16,20.624h79.024v22.528H237.44c-0.336,3.168-0.336,6.672-0.336,9.84c0,1.904,0,3.168,0,5.072h84.112  v22.528h-79.664c2.224,9.536,5.696,16.832,10.464,22.224c10.16,11.424,25.072,16.192,40.944,16.192  c14.608,0,29.52-4.768,36.192-8.256L336.768,417.664z"/>
            <polygon style="fill:#2C3E50;" points="256,0 20.016,168.784 20.016,207.184 256,38.4 491.984,207.184 491.984,168.784 "/>
            </svg>
            `;
            break;
        default:
            cardFrontIcon.innerHTML = `<div>ICON RECTO</div>`; // Icône par défaut
    }

    cardFront.appendChild(cardFrontIcon);

    // Ajoute les faces à l'élément modal-content
    modalContent.appendChild(cardFront);
    modalContent.appendChild(cardBack);

    console.log(`Added card front and back to modal content`);

    // Affiche le modal
    modal.style.display = "block";

    console.log(`Modal displayed, will flip in 1.2 seconds`);

    // Joue un son quand la carte apparaît
    try {
        const cardSound = new Audio("../assets/card-appear.wav");
        cardSound.volume = 0.5;
        cardSound.play().catch((e) => console.log("Pas de son disponible"));
    } catch (e) {
        console.log("Audio non supporté");
    }

    // Attendre 1.2 secondes pour que l'utilisateur puisse voir la face avant
    setTimeout(() => {
        console.log(`Starting flip animation - adding flipped class`);

        // Force un reflow avant d'ajouter la classe
        const initialTransform =
            window.getComputedStyle(modalContent).transform;
        console.log(`Initial transform:`, initialTransform);

        modalContent.classList.add("flipped");

        console.log(
            `Modal content classes after flip:`,
            modalContent.className,
        );

        // Force un reflow pour déclencher l'animation
        modalContent.offsetHeight;

        setTimeout(() => {
            const finalTransform =
                window.getComputedStyle(modalContent).transform;
            console.log(`Final transform after 0.8s:`, finalTransform);
            readCardContent(card, cardType);
        }, 800);

        // Joue un son quand la carte se retourne
        try {
            const flipSound = new Audio("../assets/card-flip.wav");
            flipSound.volume = 0.5;
            flipSound.play().catch((e) => console.log("Pas de son disponible"));
        } catch (e) {
            console.log("Audio non supporté");
        }
    }, 1200);
}

/**
 * Ferme le modal card-flip et réinitialise sa structure
 * @param {string} modalId - L'ID du modal à fermer
 */
function closeFlipCardModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const modalContent = modal.querySelector(".modal-content");

    // Retire la classe flipped
    modalContent.classList.remove("flipped");

    // Masque le modal après l'animation de retour
    setTimeout(() => {
        modal.style.display = "none";

        // Nettoie la structure du modal
        cleanupModalStructure(modal);

        // Retire les classes card-modal et type de carte
        modal.classList.remove("card-modal");
        Object.values(CARD_MODAL_MAP).forEach((type) => {
            modal.classList.remove(type);
        });
    }, 800);
}

/**
 * Nettoie la structure du modal pour le réinitialiser à son état d'origine
 * @param {HTMLElement} modal - L'élément modal à nettoyer
 */
function cleanupModalStructure(modal) {
    const modalContent = modal.querySelector(".modal-content");
    const cardBack = modal.querySelector(".card-back");
    const cardFront = modal.querySelector(".card-front");

    // Déplace tous les enfants de card-back vers modal-content
    if (cardBack) {
        while (cardBack.firstChild) {
            modalContent.appendChild(cardBack.firstChild);
        }

        // Supprime les éléments de structure de la carte
        if (cardBack) modalContent.removeChild(cardBack);
        if (cardFront) modalContent.removeChild(cardFront);
    }
}

/**
 * Convertit un type de carte en nom lisible
 * @param {string} cardType - Le type de carte
 * @return {string} Le nom lisible de la carte
 */
function cardTypeToName(cardType) {
    const types = {
        bonus: "Bonus",
        facture: "Facture",
        biens: "Biens",
        pdb: "Pas de Bol",
        interaction: "Interaction",
        redevance: "Redevance",
    };

    return types[cardType?.toLowerCase()] || "";
}