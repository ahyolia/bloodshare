import axios from 'axios';
import { router } from 'expo-router';
import { getToken, removeToken } from '../stores/auth.store';
import { API_URL } from '../constants/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // 📖 Sans cet en-tête, un tunnel ngrok gratuit intercale sa page
    //    d'avertissement HTML avec un statut 200 : axios recevrait du HTML là où
    //    il attend du JSON, et le parsing échouerait sans erreur réseau visible.
    //    Inoffensif quand l'API est jointe autrement (IP LAN, localhost).
    'ngrok-skip-browser-warning': 'true',
  },
});

// 📖 Plusieurs écrans lancent leurs requêtes en même temps : quand la session expire,
//    elles reviennent toutes en 401. On ne redirige qu'une fois, jusqu'à la reconnexion.
let redirectionVersLogin = false;

// 📖 Le serveur de démo (Apache, dossier utilisateur sous Debian) n'autorise que GET,
//    POST et OPTIONS : un PUT ou un DELETE y est refusé en 403 avant d'atteindre Laravel
//    (profil, suppression de compte, notifications lues, progression des quiz). Ces
//    requêtes partent donc en POST, la vraie méthode dans X-HTTP-Method-Override, que
//    Laravel lit nativement : rien ne change côté routes, et ça marche partout.
const METHODES_SURCHARGEES = ['put', 'patch', 'delete'];

// Intercepteur requête : ajoute le token automatiquement
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Une requête repart avec un token : l'utilisateur s'est reconnecté.
    redirectionVersLogin = false;
  }

  const methode = config.method?.toLowerCase();
  if (methode && METHODES_SURCHARGEES.includes(methode)) {
    config.headers['X-HTTP-Method-Override'] = methode.toUpperCase();
    config.method = 'post';
  }
  return config;
});

// Intercepteur réponse : gère les 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await removeToken();

      // 📖 Sans redirection, l'utilisateur restait sur les onglets avec des écrans en
      //    erreur : app/_layout.tsx ne relit le token qu'au changement de groupe de
      //    routes. Les tokens expirent au bout de 90 jours (config/sanctum.php), ça
      //    arrive donc à tout le monde. On ne redirige que si la requête portait un
      //    token : un 401 sans token, c'est un mauvais mot de passe au login, que
      //    l'écran de connexion affiche lui-même.
      const avaitUnToken = Boolean(error.config?.headers?.Authorization);
      if (avaitUnToken && !redirectionVersLogin) {
        redirectionVersLogin = true;
        router.replace('/auth/login?session=expiree');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
