import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
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

// Intercepteur requête : ajoute le token automatiquement
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur réponse : gère les 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_user');
    }
    return Promise.reject(error);
  }
);

export default api;
