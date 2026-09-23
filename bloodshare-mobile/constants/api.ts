// Depuis un téléphone physique, localhost désigne le téléphone lui-même : l'API
// doit être exposée à une adresse joignable depuis le réseau du téléphone, soit
// un tunnel ngrok (`ngrok http 8000`), soit l'IP LAN de la machine de dev.
//
// 📖 Cette URL vient de `.env.local` (non versionné), et non plus du dépôt. Une
//    URL écrite en dur ici envoyait toute l'équipe sur le tunnel d'une seule
//    personne : quand ce poste s'éteignait, l'app timeoutait chez tout le monde,
//    et entre-temps chacun testait sur la base de quelqu'un d'autre. Expo expose
//    automatiquement les variables préfixées EXPO_PUBLIC_ ; après modification,
//    relancer le bundler avec `npx expo start -c` (sans -c, l'ancienne valeur
//    reste en cache).
//
// Repli sur localhost : correct pour l'émulateur iOS et les tests web, inutile
// depuis un téléphone physique — d'où l'avertissement au démarrage.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api';

// 📖 Affiché à chaque démarrage en dev : sans cette trace, une URL périmée
//    (bundle mis en cache, .env.local oublié) se manifeste seulement par un
//    timeout au bout de 10 s, impossible à distinguer d'une panne réseau.
if (__DEV__) {
  console.log(`[api] URL utilisée : ${API_URL}`);

  if (!process.env.EXPO_PUBLIC_API_URL) {
    console.warn(
      "[api] EXPO_PUBLIC_API_URL n'est pas défini : repli sur " +
        `${API_URL}. Depuis un téléphone physique, créez bloodshare-mobile/.env.local ` +
        'avec EXPO_PUBLIC_API_URL=<votre tunnel ou IP LAN>/api, puis `npx expo start -c`.'
    );
  }
}
