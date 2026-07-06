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
- Actualités ACDO-NC

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

## Rôles utilisateur

L'application mobile est accessible uniquement aux utilisateurs avec le rôle `utilisateur`. Les admins accèdent au backoffice via http://localhost:8000/admin.