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

## Documentation

| Document | Description |
|---|---|
| [DEVOPS.md](DEVOPS.md) | Architecture Docker, workflow Git |
| [docs/contrat_API.md](docs/contrat_API.md) | Format des endpoints API mobile |
| [bloodshare-backend/README.md](bloodshare-backend/README.md) | Documentation backend |
| [bloodshare-mobile/README.md](bloodshare-mobile/README.md) | Documentation mobile |

## Prérequis

- Docker Desktop
- Node.js 20+
- Git

## Installation & lancement

```bash
# Cloner le repo
git clone https://github.com/ahyolia/bloodshare.git
cd bloodshare

# Configurer l'environnement (valeurs déjà alignées sur le docker-compose)
cp bloodshare-backend/.env.example bloodshare-backend/.env

# Tout lancer
docker compose up --build
```

Au premier démarrage, le conteneur `backend` fait automatiquement le reste : installation des
dépendances (`composer install`), génération de `APP_KEY`, attente de la base, migrations, puis
seeders (cartes, badges, avatars, QR Code du centre, 15 questions d'éligibilité, rôles, super
admin). Les seeders sont idempotents : relancer `docker compose up` ne duplique rien.

**Backoffice** : http://localhost:8000/admin avec `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
(définis dans `bloodshare-backend/.env`, par défaut `admin@bloodshare.local` / `Admin-local-1234`).
Compte de test pour l'app mobile : `test@example.com` / `password`.

> Cette base est **locale et indépendante** de celle des autres développeur·se·s : ce que vous
> saisissez dans votre backoffice n'apparaît pas dans leur application, et inversement.

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