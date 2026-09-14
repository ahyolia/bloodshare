// Depuis un téléphone physique, localhost désigne le téléphone lui-même.
// USE_MOCK_DATA=false → API_URL doit pointer vers une adresse joignable
// depuis le téléphone : l'URL ngrok active (change à chaque redémarrage
// du tunnel, cf. WSL2 `ngrok http 8001`) ou l'IP LAN de la machine de dev.
export const API_URL = 'https://autistic-cold-unafraid.ngrok-free.dev/api';
