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

## ⚠️ Prérequis API — Sanctum (à faire dès que le réseau est disponible dans le conteneur)

L'authentification de l'API mobile repose sur Laravel Sanctum, qui n'est pas encore installé faute d'accès réseau dans le conteneur lors du développement initial. Dès que le réseau est disponible, exécuter dans cet ordre :

```bash
docker exec bloodshare_backend composer require laravel/sanctum
docker exec bloodshare_backend php artisan install:api
docker exec bloodshare_backend php artisan migrate
```

`install:api` publie la migration de la table `personal_access_tokens` et configure le guard `sanctum` — indispensable pour que `POST /api/scan` et tous les futurs endpoints authentifiés fonctionnent.

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