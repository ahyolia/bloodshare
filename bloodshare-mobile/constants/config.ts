// Bascule mock/API : à repasser à false quand les données seront saisies dans le backoffice.
export const USE_MOCK_DATA = false;

// 📖 Mock du scan SEUL : n'importe quel QR Code « réussit » et donne une carte du mois,
//    sans rien enregistrer. Le reste de l'app garde les vraies données (et les vraies
//    images) : pratique pour tester l'animation d'obtention. Toujours false dans un commit.
export const USE_MOCK_SCAN = false;
