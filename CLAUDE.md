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
Voir `CONTRIBUTING.md` à la racine du repo — branches, commits, PR, Definition of Done.
Règle à ne jamais oublier : une branche par tâche (US ClickUp), jamais de commit direct sur `main`.

- Les ressources Filament suivent le style de `StockSangResource.php`
  (Select avec options explicites, BadgeColumn colorée, navigationGroup défini)
- Toujours grouper les ressources dans la sidebar via `navigationGroup`
  (Opérations / Contenu éditorial / Gamification / Utilisateurs / Administration)
- Les champs `admin_id` sont remplis automatiquement via `Auth::id()`, jamais
  saisis manuellement dans les formulaires

## Conventions de développement (workflow d'équipe)
Le détail complet (branches, commits, PR, Definition of Done) est dans
`docs/Conventions de développement.md`. Résumé :
- Branches : `type/description-courte-US-xx` (ex. `feat/validation-don-US-09`)
- Commits : `type(portée): description` en français, style
  [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
  (ex. `feat(don): saisie et validation du code anonyme`)
  - Types : `feat` / `fix` / `refactor` / `test` / `docs` / `chore` / `style`
  - `refactor` ne change jamais le comportement
- Une PR par branche vers `dev`, titre = même idée que le commit, relecture
  obligatoire avant merge, branche supprimée après merge
- Definition of Done : critères d'acceptation cochés, tests écrits et
  passants, code relu, build main toujours vert après merge
- Contraintes projet à vérifier à chaque tâche : anonymat (aucune donnée
  médicale/identité réelle stockée), architecture adaptateur (accès aux
  données via couche découplée)