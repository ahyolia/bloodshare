# Aïma Backend — Contexte projet

## ⚠️ Règles métier non négociables
Ces règles priment sur toute autre considération technique. En cas de doute,
demander plutôt que supposer.

### Gamification
- Un **don validé** ou une **présence à un événement** rapporte **une
  carte-souvenir et ZÉRO point**. Ne jamais écrire dans `points_historique`
  lors d'un scan de QR code.
- Le don est un acte volontaire et gratuit : on ne le transforme jamais en
  transaction récompensée. C'est une exigence éthique de l'association, pas
  une préférence de conception.
- Les points proviennent **uniquement** des quiz, des parrainages et des
  défis collectifs.
- Les **cartes sont déterministes** : pas de tirage aléatoire, pas de rareté,
  pas de booster. La carte obtenue dépend du mois du don.
- Les **badges** sont attribués automatiquement par paliers, et restent
  distincts des cartes (pas de fusion des deux concepts).

### Anonymat et données personnelles
- Ne jamais collecter ni stocker : nom, prénom, date de naissance, numéro de
  donneur, groupe sanguin de l'utilisateur, ni aucune donnée médicale.
- Le compte utilisateur ne sert qu'à la gamification. La validation d'un don
  passe par un QR code anonyme.
- Le `sexe` n'est stocké que pour calculer la prochaine éligibilité
  (6 dons/an homme, 4/an femme) : ne jamais l'exposer dans le backoffice,
  ne pas l'ajouter à un nouvel endpoint, ne rien construire d'autre dessus.
- Le backoffice n'affiche que des **pseudonymes**. Les e-mails servent
  uniquement à l'authentification et ne sont jamais exposés dans les
  interfaces d'administration.
- Le questionnaire d'éligibilité ne persiste aucune réponse.

### Ton et rédaction
- Les messages destinés aux utilisateurs (erreurs, notifications, libellés)
  sont chaleureux, rassurants et jamais culpabilisants. Proscrire le
  vocabulaire clinique ou anxiogène.

## Stack
- Laravel 12 + PHP 8.3
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

**Ne jamais lancer de commande destructive sans confirmation explicite**
(`migrate:fresh`, `migrate:refresh`, `migrate:rollback`, `db:wipe`) : la base
locale contient du contenu saisi via Filament que les seeders ne recréent pas.

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