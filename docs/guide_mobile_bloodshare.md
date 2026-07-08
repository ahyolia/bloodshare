# Guide de développement mobile — BloodShare 🩸

## Stack technique

- **Framework** : React Native + Expo SDK
- **Navigation** : Expo Router (file-based routing)
- **Langage** : TypeScript
- **Requêtes API** : Axios
- **Stockage token** : expo-secure-store
- **Scan QR Code** : expo-camera + expo-barcode-scanner
- **Notifications** : expo-notifications

---

## Installation & démarrage

```bash
cd bloodshare-mobile
npm install
npx expo start
```

Scanner le QR Code avec **Expo Go** sur votre téléphone, ou appuyer sur :
- `a` → émulateur Android
- `i` → simulateur iOS

---

## Configuration API

Créez un fichier `constants/api.ts` :

```typescript
export const API_URL = 'http://localhost:8000/api'; // dev local
// export const API_URL = 'https://votre-app.onrender.com/api'; // prod
```

---

## Structure des dossiers recommandée

```
bloodshare-mobile/
├── app/                         → écrans (Expo Router)
│   ├── (auth)/                  → onboarding, login, register
│   │   ├── _layout.tsx
│   │   ├── onboarding.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                  → navigation principale
│   │   ├── _layout.tsx          → TabBar avec 5 onglets
│   │   ├── index.tsx            → Accueil
│   │   ├── don.tsx              → Don
│   │   ├── quiz.tsx             → Quiz
│   │   ├── cartes.tsx           → Cartes
│   │   └── profil.tsx           → Profil
│   └── _layout.tsx              → layout racine (auth guard)
├── components/                  → composants réutilisables
│   ├── ui/                      → boutons, inputs, cards...
│   ├── CarteCard.tsx
│   ├── BadgeItem.tsx
│   ├── StockSangBar.tsx
│   └── QuizQuestion.tsx
├── services/                    → appels API
│   ├── api.ts                   → instance Axios configurée
│   ├── auth.service.ts
│   ├── cartes.service.ts
│   ├── quiz.service.ts
│   └── ...
├── stores/                      → état global
│   ├── auth.store.ts            → user + token
│   └── ...
├── hooks/                       → hooks personnalisés
│   ├── useAuth.ts
│   └── useApi.ts
├── constants/
│   ├── api.ts                   → URL de base
│   ├── colors.ts                → palette BloodShare
│   └── groupes-sanguins.ts
└── assets/
    ├── cartes/                  → images des 12+3 cartes
    ├── badges/                  → images des badges
    └── avatars/                 → 5 avatars
```

---

## Configuration Axios (`services/api.ts`)

```typescript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur : ajoute le token automatiquement à chaque requête
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur : gère les 401 (token expiré → déconnexion)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      // Rediriger vers login (à adapter selon votre router)
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## Gestion du token (auth store)

```typescript
// stores/auth.store.ts
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const saveToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async () => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
};

export const saveUser = async (user: object) => {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
};

export const getUser = async () => {
  const user = await SecureStore.getItemAsync(USER_KEY);
  return user ? JSON.parse(user) : null;
};
```

---

## Auth Guard (layout racine)

```typescript
// app/_layout.tsx
import { useEffect, useState } from 'react';
import { Slot, useRouter } from 'expo-router';
import { getToken } from '../stores/auth.store';

export default function RootLayout() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await getToken();
    if (!token) {
      router.replace('/(auth)/onboarding');
    } else {
      router.replace('/(tabs)');
    }
    setChecked(true);
  };

  if (!checked) return null;
  return <Slot />;
}
```

---

## Ordre de développement recommandé

### Sprint 1 — Fondations (à faire ensemble en premier)
```
1. Configurer Expo Router + structure dossiers
2. Créer l'instance Axios (services/api.ts)
3. Créer le store auth (stores/auth.store.ts)
4. Écran Login → appel POST /api/auth/login
5. Écran Register → appel POST /api/auth/register
6. Auth guard (layout racine)
7. Navigation principale (5 onglets vides)
```
✅ À la fin du Sprint 1 : on peut se connecter et voir les 5 onglets vides.

---

### Sprint 2 — Accueil & Don (à répartir)

```
8. Onglet Accueil
   - Stock de sang (GET /api/stock-sang)
   - Bannière alerte (GET /api/bannieres)
   - Événements à venir (GET /api/evenements)
   - Défi du mois (GET /api/defis/actuel)
   - Actualités carousel (GET /api/actualites)
```

```
9. Onglet Don
   - Questionnaire éligibilité (JSON local, pas d'API)
   - Fiches infos (GET /api/fiches-infos)
   - Lien CNT (WebView ou Linking.openURL)
   - Écran scan QR Code (expo-camera)
     → POST /api/scan
     → Écran résultat (carte obtenue + badges)
```

---

### Sprint 3 — Quiz & Cartes (à répartir)

```
10. Onglet Quiz
    - Liste par catégorie (GET /api/quiz)
    - Écran quiz (GET /api/quiz/{id})
    - Soumission + résultat (POST /api/quiz/{id}/soumettre)
```

```
11. Onglet Cartes
    - Collection par catégorie (GET /api/cartes)
    - Affichage carte en grand
    - Pourcentage de collection
```

---

### Sprint 4 — Profil (à répartir)

```
12. Onglet Profil
    - Infos user (GET /api/me)
    - Points cumulés
    - Historique dons (GET /api/dons)
    - Historique points (GET /api/points/historique)
```

```
13. Onglet Profil (suite)
    - Badges obtenus (GET /api/badges)
    - Code parrainage (GET /api/parrainage/code)
    - Modifier profil (PUT /api/me)
    - Déconnexion (POST /api/auth/logout)
    - Supprimer compte (DELETE /api/me)
```

---

## Données mockées (pour avancer sans attendre l'API)

Si un endpoint n'est pas encore prêt ou que vous voulez avancer
sur l'UI sans dépendre du backend, utilisez des données mockées :

```typescript
// services/mock/stock-sang.mock.ts
export const mockStockSang = [
  { groupe_sanguin: 'O-', niveau: 'critique' },
  { groupe_sanguin: 'O+', niveau: 'bas' },
  { groupe_sanguin: 'A-', niveau: 'correct' },
  { groupe_sanguin: 'A+', niveau: 'bon' },
  { groupe_sanguin: 'B-', niveau: 'correct' },
  { groupe_sanguin: 'B+', niveau: 'bon' },
  { groupe_sanguin: 'AB-', niveau: 'bas' },
  { groupe_sanguin: 'AB+', niveau: 'correct' },
];
```

Puis dans votre composant, commentez/décommentez :

```typescript
// const { data } = await api.get('/stock-sang'); // prod
const data = mockStockSang; // dev
```

---

## Gestion des images (cartes, badges, avatars)

Pour la V1, les images sont des assets locaux embarqués dans l'app :

```typescript
// constants/cartes-images.ts
export const CARTES_IMAGES: Record<string, any> = {
  'mois_1': require('../assets/cartes/janvier.webp'),
  'mois_2': require('../assets/cartes/fevrier.webp'),
  // ...
  'evenement': require('../assets/cartes/evenement.webp'),
  'parrain': require('../assets/cartes/parrain.webp'),
  'filleul': require('../assets/cartes/filleul.webp'),
};

// Utilisation :
// const image = CARTES_IMAGES[`mois_${carte.mois_numero}`]
//            ?? CARTES_IMAGES[carte.categorie];
```

---

## Scan QR Code

```typescript
// components/QrScanner.tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import api from '../services/api';

export default function QrScanner({ onResult }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleScan = async ({ data: token }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const response = await api.post('/scan', { token });
      onResult(response.data); // passer le résultat au parent
    } catch (error) {
      // Gérer 422 (délai non respecté), 404 (token invalide)
      onResult(null, error.response?.data);
    }
  };

  if (!permission?.granted) {
    return <Button onPress={requestPermission} title="Autoriser la caméra" />;
  }

  return (
    <CameraView
      onBarcodeScanned={scanned ? undefined : handleScan}
      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      style={{ flex: 1 }}
    />
  );
}
```

---

## Questionnaire éligibilité (JSON local)

Le questionnaire d'éligibilité est codé en dur côté mobile —
aucun appel API, aucune donnée stockée en BDD.

```typescript
// constants/eligibilite.ts
export const QUESTIONS_ELIGIBILITE = [
  {
    id: 1,
    question: "Avez-vous mangé dans les 4 dernières heures ?",
    type: "oui_non",
    si_oui: { message: "Attendez 4h après un repas avant de donner.", eligible: false },
    si_non: { suivant: 2 }
  },
  {
    id: 2,
    question: "Avez-vous de la fièvre ou vous sentez-vous malade ?",
    type: "oui_non",
    si_oui: { message: "Ne donnez pas si vous êtes malade.", eligible: false },
    si_non: { suivant: 3 }
  },
  // ... autres questions
  {
    id: 99,
    // question finale
    message: "Vous semblez éligible ! Rendez-vous au centre CNT.",
    eligible: true
  }
];
```

---

## Conventions à respecter

```
- TypeScript strict partout (pas de any si évitable)
- Un fichier = un composant ou un service
- Nommer les fichiers en kebab-case (stock-sang-bar.tsx)
- Nommer les composants en PascalCase (StockSangBar)
- Toujours gérer les états loading + error sur les appels API
- Ne jamais stocker le token dans AsyncStorage (utiliser SecureStore)
- Commiter souvent avec des messages clairs
  feat(accueil): affichage stock de sang
  feat(don): écran scan QR Code
  fix(auth): redirection après logout
```

---

## Endpoints disponibles dès maintenant

Tous ces endpoints sont opérationnels et testés :

| Endpoint | Auth | Description |
|----------|------|-------------|
| POST /api/auth/register | ❌ | Inscription |
| POST /api/auth/login | ❌ | Connexion |
| POST /api/auth/logout | ✅ | Déconnexion |
| POST /api/auth/forgot-password | ❌ | Mot de passe oublié |
| GET /api/me | ✅ | Profil utilisateur |
| PUT /api/me | ✅ | Modifier profil |
| DELETE /api/me | ✅ | Supprimer compte |
| POST /api/scan | ✅ | Scanner QR Code |
| GET /api/dons | ✅ | Historique dons |
| GET /api/cartes | ✅ | Collection cartes |
| GET /api/badges | ✅ | Badges |
| GET /api/points/historique | ✅ | Historique points |
| GET /api/parrainage/code | ✅ | Code parrainage |
| GET /api/stock-sang | ❌ | Stocks par groupe |
| GET /api/bannieres | ❌ | Alerte pénurie |
| GET /api/actualites | ❌ | Actualités |
| GET /api/fiches-infos | ❌ | Fiches pratiques |
| GET /api/faq | ❌ | FAQ |
| GET /api/evenements | ❌ | Événements |
| GET /api/quiz | ✅ | Liste quiz |
| GET /api/quiz/{id} | ✅ | Détail quiz |
| POST /api/quiz/{id}/soumettre | ✅ | Soumettre quiz |
| GET /api/defis/actuel | ✅ | Défi du mois |

> ✅ = nécessite Authorization: Bearer {token}
> ❌ = accessible sans token

Le format exact de chaque réponse est dans `docs/contrat_API.md`.
```
