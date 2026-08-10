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

## API mobile

Auth via Laravel Sanctum (token Bearer). Format exact des requêtes/réponses : voir **[docs/contrat_API.md](../docs/contrat_API.md)** à la racine du repo.

Endpoints disponibles :

```
POST   /api/auth/register          Inscription (+ code de parrainage optionnel)
POST   /api/auth/login             Connexion
POST   /api/auth/logout            Déconnexion (authentifié)
POST   /api/auth/forgot-password   Envoi email de réinitialisation
GET    /api/me                     Profil de l'utilisateur connecté (authentifié)
PUT    /api/me                     Mise à jour du profil (authentifié)
DELETE /api/me                     Suppression du compte, soft delete (authentifié)
POST   /api/scan                   Scan QR Code (authentifié)

GET    /api/dons                   Historique des dons (authentifié)
GET    /api/cartes                 Collection de cartes par catégorie (authentifié)
GET    /api/badges                 Badges obtenus/non obtenus (authentifié)
GET    /api/points/historique      Historique des points (authentifié)
GET    /api/parrainage/code        Code + parrainages validés (authentifié)

GET    /api/actualites             Actualités publiées (public)
GET    /api/fiches-infos           Fiches info publiées (public)
GET    /api/faq                    FAQ (public)
GET    /api/stock-sang             Niveaux de stock par groupe sanguin (public)
GET    /api/evenements             Événements à venir (public)
GET    /api/bannieres              Bannière d'urgence active (public)

GET    /api/quiz                   Liste des quiz par catégorie (authentifié)
GET    /api/quiz/{id}              Détail d'un quiz (sans réponses correctes, authentifié)
POST   /api/quiz/{id}/soumettre    Soumission des réponses (authentifié)
GET    /api/defis/actuel           Défi communautaire du mois en cours (authentifié)
```

Vérifier les routes enregistrées :

```bash
docker exec bloodshare_backend php artisan route:list --path=api
```

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