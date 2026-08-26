# BloodShare — Mobile 🩸

Application mobile React Native (Expo) de BloodShare — plateforme gamifiée de sensibilisation au don du sang en Nouvelle-Calédonie.

## Stack

- **Framework** : React Native
- **Environnement** : Expo
- **Auth** : Laravel Sanctum (tokens API)

## Prérequis

- Node.js 20+
- Expo Go (sur votre téléphone) ou un émulateur Android/iOS
- Le backend doit tourner sur http://localhost:8000

## Installation

```bash
npm install
```

## Lancer l'application

```bash
npx expo start
```

Scannez le QR Code avec Expo Go sur votre téléphone, ou appuyez sur :
- `a` → émulateur Android
- `i` → simulateur iOS
- `w` → navigateur web

## Fonctionnalités

### Authentification
- Inscription / Connexion
- Récupération de mot de passe

### Accueil
- Stock de sang en temps réel par groupe sanguin
- Bannières d'alerte
- Événements à venir
- Don du mois
- Actualités ADSB-NC

### Dons
- Questionnaire d'éligibilité
- Informations pratiques sur le don
- Lien vers le site officiel du CNT
- Scan QR Code pour valider un don

### Cartes
- Collection de cartes à collectionner (12 cartes, 2 raretés)
- Ouverture de boosters (3 cartes dont 1 rare garantie)
- Scan QR Code pour obtenir un booster

### Profil
- Points cumulés
- Badges obtenus
- Historique des dons
- Défis en cours
- Paramètres du compte

## Connexion au backend

Configurez l'URL de l'API dans votre fichier de configuration :

```
API_URL=http://localhost:8000/api
```

## Endpoints disponibles

Le contrat API complet (requêtes, réponses JSON exactes, codes d'erreur) est dans **[docs/contrat_API.md](../docs/contrat_API.md)** à la racine du repo — à lire avant de coder les écrans concernés. Tous les endpoints du contrat sont désormais implémentés côté backend :

```
POST   /auth/register          → inscription, connecte directement (renvoie token + user)
POST   /auth/login             → connexion (renvoie token + user)
POST   /auth/logout            → déconnexion (header Authorization requis)
POST   /auth/forgot-password   → email de réinitialisation
GET    /me                     → profil complet (header Authorization requis)
PUT    /me                     → modifier pseudo / avatar (header Authorization requis)
DELETE /me                     → supprimer le compte (header Authorization requis)
POST   /scan                   → scan QR Code (header Authorization requis)

GET    /dons                   → historique des dons (header Authorization requis)
GET    /cartes                 → collection de cartes par catégorie (header Authorization requis)
GET    /badges                 → badges obtenus/non obtenus (header Authorization requis)
GET    /points/historique      → historique des points (header Authorization requis)
GET    /parrainage/code        → code + parrainages validés (header Authorization requis)

GET    /actualites             → actualités publiées (public)
GET    /fiches-infos           → fiches info publiées (public)
GET    /faq                    → FAQ (public)
GET    /stock-sang             → niveaux de stock par groupe sanguin (public)
GET    /evenements             → événements à venir (public)
GET    /bannieres              → bannière d'urgence active (public)

GET    /quiz                   → liste des quiz par catégorie (header Authorization requis)
GET    /quiz/{id}               → détail d'un quiz, sans réponses correctes (header Authorization requis)
POST   /quiz/{id}/soumettre    → soumission des réponses (header Authorization requis)
GET    /defis/actuel           → défi communautaire du mois en cours (header Authorization requis)
```

Après `login`/`register`, stocker le `token` reçu (idéalement via `expo-secure-store`, jamais en clair) et l'envoyer dans le header `Authorization: Bearer <token>` de chaque appel authentifié.

## Rôles utilisateur

L'application mobile est accessible uniquement aux utilisateurs avec le rôle `utilisateur`. Les admins accèdent au backoffice via http://localhost:8000/admin.