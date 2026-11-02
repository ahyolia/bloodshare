# Aïma — Mobile 🩸

Application mobile React Native (Expo) d'Aïma — plateforme gamifiée de sensibilisation au don du sang en Nouvelle-Calédonie.

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
- Inscription / Connexion (avec code de parrainage facultatif)
- Mot de passe oublié : pas d'e-mail automatique en V1. L'écran explique la procédure : écrire à
  l'association depuis l'adresse du compte, un admin réinitialise depuis le backoffice et renvoie
  un mot de passe temporaire, que l'app oblige à changer à la connexion suivante

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
- Collection de cartes-souvenirs, attribuées directement par une action (pas de tirage, pas de
  booster, pas de rareté) :
  - carte du mois (12, une par mois) : don validé au centre
  - carte Événement : présence validée à un événement (affichée « Événement terminé » une fois
    l'événement passé)
  - cartes Parrain, Filleul et Fidèle
- Une carte du mois déjà possédée n'est pas redonnée, et rien n'est donné en échange
- Règles complètes : [docs/doc_gamification.md](../docs/doc_gamification.md)

### Quiz
- Parcours de quiz par catégorie, rejouables
- Points gagnés à la première complétion seulement

### Profil
- Points cumulés et niveau (un don ne rapporte jamais de points : seuls les quiz et le parrainage
  en donnent)
- Badges obtenus
- Historique des dons
- Défis en cours
- Paramètres du compte

## Connexion au backend

Configurez l'URL de l'API dans `bloodshare-mobile/.env.local` (copie de `.env.example`, qui
détaille ngrok et l'IP LAN) :

```
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

Cette valeur est intégrée au build : **ne pas construire le site en ligne (Netlify) avec son
`.env.local`**, il appellerait votre backend local. Utiliser le script dédié, voir
[DEVOPS.md, section 6](../DEVOPS.md#front-web-netlify).

## Endpoints disponibles

Le contrat API complet (requêtes, réponses JSON exactes, codes d'erreur) est dans **[docs/contrat_API.md](../docs/contrat_API.md)** à la racine du repo — à lire avant de coder les écrans concernés. Tous les endpoints du contrat sont désormais implémentés côté backend :

```
POST   /auth/register          → inscription, connecte directement (renvoie token + user)
POST   /auth/login             → connexion (renvoie token + user)
POST   /auth/logout            → déconnexion (header Authorization requis)
GET    /me                     → profil complet (header Authorization requis)
PUT    /me                     → modifier pseudo / avatar (header Authorization requis)
DELETE /me                     → supprimer le compte (header Authorization requis)
POST   /me/changer-mot-de-passe → changer son mot de passe (header Authorization requis)
POST   /scan                   → scan QR Code (header Authorization requis)

GET    /dons                   → historique des dons (header Authorization requis)
GET    /cartes                 → collection de cartes par catégorie (header Authorization requis)
GET    /badges                 → badges obtenus/non obtenus (header Authorization requis)
GET    /badges/a-feter         → badges obtenus pas encore célébrés (header Authorization requis)
GET    /points/historique      → historique des points (header Authorization requis)
GET    /parrainage/code        → code + parrainages validés (header Authorization requis)

GET    /actualites             → actualités publiées (public)
GET    /fiches-infos           → fiches info publiées (public)
GET    /stock-sang             → niveaux de stock par groupe sanguin (public)
GET    /evenements             → événements à venir (public)
GET    /bannieres              → bannière d'urgence active (public)
GET    /eligibilite            → questions d'éligibilité (public)
GET    /documents-juridiques/{type} → CGU, confidentialité, mentions légales (public)

GET    /quiz                   → liste des quiz par catégorie (header Authorization requis)
GET    /quiz/{id}               → détail d'un quiz, sans réponses correctes (header Authorization requis)
PUT    /quiz/{id}/progression  → sauvegarde de la progression (header Authorization requis)
POST   /quiz/{id}/questions/{questionId}/verifier → correction d'une question (header Authorization requis)
POST   /quiz/{id}/soumettre    → soumission des réponses (header Authorization requis)
GET    /defis/actuel           → défi communautaire du mois en cours (header Authorization requis)

GET    /notifications          → notifications (header Authorization requis)
GET    /notifications/non-lues → nombre de non lues (header Authorization requis)
PUT    /notifications/lues     → tout marquer comme lu (header Authorization requis)
PUT    /notifications/{id}/lue → marquer une notification comme lue (header Authorization requis)
POST   /notifications/subscription   → abonnement push (header Authorization requis)
DELETE /notifications/subscription   → désabonnement push (header Authorization requis)
```

Après `login`/`register`, stocker le `token` reçu (idéalement via `expo-secure-store`, jamais en clair) et l'envoyer dans le header `Authorization: Bearer <token>` de chaque appel authentifié.

## Rôles utilisateur

L'application mobile est réservée aux donneurs, c'est-à-dire aux comptes **sans rôle** (il
n'existe pas de rôle `utilisateur`). Un compte du backoffice (`admin`, `super_admin`) est refusé
à la connexion (403), et un token mobile qu'il aurait obtenu avant est refusé sur toutes les
routes. Les admins accèdent au backoffice via http://localhost:8000/admin.