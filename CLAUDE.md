# BloodShare Backend — Contexte projet

## Stack
- Laravel 11 + PHP 8.3
- Filament 3 (backoffice)
- PostgreSQL 15
- Spatie Laravel Permission (rôles : super_admin, admin)
- Tout tourne en Docker, conteneur nommé `bloodshare_backend`

## ⚠️ Important — Exécution des commandes
Le PHP local n'est pas à jour (8.0), donc **toute commande artisan ou composer
doit être exécutée dans le conteneur Docker**, jamais directement en local.

Toujours préfixer les commandes comme ceci :

```bash
docker exec -it bloodshare_backend php artisan make:filament-resource NomResource
docker exec -it bloodshare_backend php artisan migrate
docker exec -it bloodshare_backend composer require xxx
```

Si le conteneur n'est pas démarré, le lancer depuis la racine du repo (pas
depuis bloodshare-backend) :

```bash
cd /c/Dev/bloodshare
docker compose up -d
```

## Structure du projet
- `app/Models/` → modèles Eloquent (24 tables)
- `app/Filament/Resources/` → ressources backoffice
- `database/migrations/` → migrations versionnées, à respecter dans l'ordre
- Rôles : `super_admin` (accès total) et `admin` (tout sauf Paramètres système)

## Conventions
- Les ressources Filament suivent le style de `StockSangResource.php`
  (Select avec options explicites, BadgeColumn colorée, navigationGroup défini)
- Toujours grouper les ressources dans la sidebar via `navigationGroup`
  (Opérations / Contenu éditorial / Gamification / Utilisateurs / Administration)
- Les champs `admin_id` sont remplis automatiquement via `Auth::id()`, jamais
  saisis manuellement dans les formulaires