# BloodShare — Backend 🩸

Backend Laravel 11 de l'application BloodShare. Gère à la fois l'API REST pour l'application mobile et le backoffice d'administration via Filament.

## Stack

- **Framework** : Laravel 11
- **PHP** : 8.3
- **Base de données** : PostgreSQL 15
- **Auth API** : Laravel Sanctum
- **Rôles & permissions** : Spatie Laravel Permission
- **Backoffice** : Filament 3

## Prérequis

- Docker Desktop
- PHP 8.3+ (ou utiliser Docker uniquement)
- Composer

## Installation

```bash
# Installer les dépendances via Docker (recommandé si PHP local < 8.3)
docker run --rm -v "$(pwd):/app" composer:latest install --ignore-platform-reqs --no-scripts

# Configurer l'environnement
cp .env.example .env
```

## Configuration `.env`

```env
APP_NAME=BloodShare
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=bloodshare
DB_USERNAME=bloodshare
DB_PASSWORD=bloodshare123
```

## Lancer via Docker

```bash
# Depuis la racine du repo
docker compose up --build
```

## Commandes utiles

```bash
# Lancer les migrations
docker exec -it bloodshare_backend php artisan migrate

# Lancer les seeders
docker exec -it bloodshare_backend php artisan db:seed

# Créer un utilisateur Filament
docker exec -it bloodshare_backend php artisan make:filament-user

# Vider le cache
docker exec -it bloodshare_backend php artisan optimize:clear
```

## Accès

| Service | URL |
|---|---|
| API | http://localhost:8000/api |
| Backoffice | http://localhost:8000/admin |

## Structure BDD

Le schéma comprend 20 tables :

```
users               → comptes utilisateurs et admins
evenements          → événements CNT avec QR Code
qr_codes            → QR Codes (centre fixe + événements)
qr_code_scans       → historique des scans
dons                → dons validés
boosters            → boosters obtenus
cartes              → catalogue des 12 cartes
user_cartes         → collection de chaque utilisateur
badges              → badges disponibles
user_badges         → badges obtenus
defis               → défis individuels et communautaires
user_defis          → progression des défis
quiz                → quiz de culture générale
questions           → questions de chaque quiz
reponses            → réponses proposées
user_quiz           → résultats des quiz
contenus            → articles, actualités, don du mois
bannieres           → alertes et bannières
stock_sang          → niveaux de stock par groupe sanguin
points_historique   → traçabilité des points
```

## Rôles

```bash
# Créer les rôles et assigner le super admin
docker exec -it bloodshare_backend php artisan db:seed --class=RolesAndPermissionsSeeder
```

| Rôle | Description |
|---|---|
| `super_admin` | Accès total — gestion des admins et paramètres système |
| `admin` | Gestion du contenu, des utilisateurs et de la gamification |
| `utilisateur` | Accès API mobile uniquement |