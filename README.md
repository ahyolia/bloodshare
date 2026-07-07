# BloodShare 🩸

Application mobile gamifiée de sensibilisation et fidélisation des donneurs de sang en Nouvelle-Calédonie, développée pour l'association ADSB-NC.

## Concept

BloodShare encourage les non-donneurs à passer à l'acte et fidélise les donneurs existants via un système de récompenses : points, badges et cartes à collectionner obtenus après chaque don ou participation à un événement.

## Stack technique

| Composant | Technologie |
|---|---|
| Application mobile | React Native (Expo) |
| Backend & API REST | Laravel 11 + Sanctum |
| Backoffice | Laravel + Filament |
| Base de données | PostgreSQL 15 |
| Gestion des rôles | Spatie Laravel Permission |
| Environnement | Docker |

## Structure du repo

```
bloodshare/
├── bloodshare-backend    → Laravel (API REST + Backoffice Filament)
├── bloodshare-mobile     → React Native Expo
└── docker-compose.yml    → Orchestration Docker
```

## API mobile

L'authentification de l'API repose sur Laravel Sanctum (tokens Bearer). Le format exact de chaque endpoint (requêtes, réponses JSON, codes d'erreur) est documenté dans **[docs/contrat_API.md](docs/contrat_API.md)** — à lire avant toute intégration côté mobile. Ce document inclut un tableau d'état d'implémentation ; tous les endpoints sont désormais implémentés côté backend.

## Prérequis

- Docker Desktop
- Node.js 20+
- Git

## Installation & lancement

```bash
# Cloner le repo
git clone https://github.com/ahyolia/bloodshare.git
cd bloodshare

# Installer les dépendances Laravel via Docker
docker run --rm -v "$(pwd)/bloodshare-backend:/app" composer:latest install --ignore-platform-reqs --no-scripts

# Configurer l'environnement
cp bloodshare-backend/.env.example bloodshare-backend/.env

# Lancer les conteneurs
docker compose up --build
```

## Accès

| Service | URL |
|---|---|
| API Laravel | http://localhost:8000 |
| Backoffice Filament | http://localhost:8000/admin |
| pgAdmin | http://localhost:5050 |

## Connexion pgAdmin

- **Email** : admin@local.dev
- **Password** : admin
- **Host** : db / **Port** : 5432 / **User** : bloodshare / **Password** : bloodshare123

## Lancer l'appli mobile

```bash
cd bloodshare-mobile
npm install
npx expo start
```

## Rôles

| Rôle | Accès |
|---|---|
| `super_admin` | Gestion des admins, paramètres système |
| `admin` | Contenu éditorial, utilisateurs, gamification |
| `utilisateur` | Application mobile uniquement |