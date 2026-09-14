# BloodShare Backend — Contexte projet

API Laravel + backoffice Filament de l'application de fidélisation des donneurs
de sang, développée pour l'ADSB-NC dans le cadre d'une SAÉ universitaire.

---

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
- **Exception en cours d'arbitrage — le `sexe`** : il est aujourd'hui demandé
  à l'inscription et stocké en base, car la fréquence maximale de don en
  dépend (6/an homme, 4/an femme) et sert au calcul de la prochaine
  éligibilité. Cette donnée est sensible et l'arbitrage d'équipe n'a pas
  encore eu lieu. En attendant : ne l'utiliser que pour ce calcul, ne jamais
  l'exposer dans le backoffice, ne jamais l'ajouter à un nouvel endpoint, et
  ne rien construire d'autre dessus.
- Le backoffice n'affiche que des **pseudonymes**. Les e-mails servent
  uniquement à l'authentification et ne sont jamais exposés dans les
  interfaces d'administration.
- Le questionnaire d'éligibilité ne persiste aucune réponse : tout reste en
  session.

### Ton et rédaction

- Les messages destinés aux utilisateurs (erreurs, notifications, libellés)
  doivent être chaleureux, rassurants et jamais culpabilisants.
- Proscrire le vocabulaire clinique ou anxiogène.
- Les messages d'erreur de scan doivent être distincts et explicites :
  code invalide / code déjà utilisé / code expiré.

---

## Stack

- Laravel 11 + PHP 8.3
- Filament 3 (backoffice)
- PostgreSQL 15
- Laravel Sanctum (authentification API par tokens Bearer)
- Spatie Laravel Permission (rôles : `super_admin`, `admin`)
- Tout tourne en Docker, conteneur nommé `bloodshare_backend`

---

## ⚠️ Exécution des commandes

Le PHP local n'est pas à jour (8.0), donc **toute commande artisan ou composer
doit être exécutée dans le conteneur Docker**, jamais directement en local.

Toujours préfixer les commandes ainsi :

```bash
docker exec -it bloodshare_backend php artisan make:filament-resource NomResource
docker exec -it bloodshare_backend php artisan migrate
docker exec -it bloodshare_backend composer require xxx
```

Si le conteneur n'est pas démarré, le lancer depuis la racine du dépôt
(pas depuis `bloodshare-backend`) :

```bash
cd /c/Dev/bloodshare
docker compose up -d
```

### Tests

```bash
docker exec -it bloodshare_backend php artisan test
docker exec -it bloodshare_backend php artisan test --filter Unit
docker exec -it bloodshare_backend php artisan test --filter Feature
```

### Base de données

```bash
docker exec -it bloodshare_backend php artisan migrate
docker exec -it bloodshare_backend php artisan db:seed
```

**Ne jamais lancer de commande destructive sans demander confirmation
explicite** — cela inclut `migrate:fresh`, `migrate:refresh`,
`migrate:rollback` et `db:wipe`. La base locale contient du contenu saisi
manuellement via Filament qui n'est pas toujours reproductible par les seeders.

---

## Base de données

22 tables métier, réparties en 5 domaines (les tables techniques de Laravel,
Sanctum et Spatie Permission ne sont pas comptées ici) :

| Domaine | Tables |
|---|---|
| Utilisateurs | `users`, `avatars` |
| Dons & QR codes | `dons`, `qr_codes`, `qr_code_scans` |
| Gamification | `cartes`, `user_cartes`, `badges`, `user_badges`, `defis`, `user_defis`, `points_historique`, `parrainages` |
| Quiz | `quiz`, `questions`, `reponses`, `user_quiz` |
| Contenu | `contenus`, `bannieres`, `faq`, `evenements`, `stock_sang` |

Notes :

- `contenus` sert à la fois aux actualités et aux fiches infos, distinguées
  par un champ `categorie`.
- Il n'existe **aucune table de boosters** : le modèle booster/rareté a été
  abandonné au profit de cartes déterministes.

---

## Structure du projet

- `app/Models/` → modèles Eloquent
- `app/Filament/Resources/` → ressources backoffice
- `app/Http/Controllers/` → controllers API
- `app/Http/Requests/` → validation des données entrantes (Form Requests)
- `app/Services/` → logique métier (QrCodeService, GamificationService…)
- `database/migrations/` → migrations versionnées, à respecter dans l'ordre
- `database/seeders/` → données initiales et jeu de démonstration
- `routes/api.php` → endpoints consommés par l'application mobile
- `routes/web.php` → backoffice Filament

---

## Architecture

- Architecture client-serveur en trois couches : application mobile React
  Native (dépôt séparé) ↔ API REST Laravel ↔ PostgreSQL.
- **Toute la logique métier vit côté serveur.** L'application mobile ne décide
  jamais de l'attribution d'une carte, d'un badge ou de points : elle envoie
  une demande, le serveur tranche.
- Le backoffice Filament est intégré au même projet Laravel, accessible
  uniquement depuis un navigateur desktop sur `/admin`.
- Les écritures liées à un scan (enregistrement du don, attribution de la
  carte, vérification des badges, progression du défi, invalidation du QR)
  doivent être encapsulées dans une **transaction**.

### Rôles

- `super_admin` → accès total, y compris les paramètres système et la gestion
  des comptes admins.
- `admin` → membres de l'association : contenu, stocks, événements,
  utilisateurs. La section Administration doit lui être **invisible et
  protégée côté serveur** (masquer l'entrée de menu ne suffit pas).

---

## Conventions Filament

- Suivre le style de `StockSangResource.php` : `Select` avec options
  explicites, `BadgeColumn` colorée, `navigationGroup` défini.
- Toujours grouper les ressources dans la sidebar via `navigationGroup` :
  Opérations / Contenu éditorial / Gamification / Utilisateurs / Administration.
- Les champs `admin_id` sont remplis automatiquement via `Auth::id()`, jamais
  saisis manuellement dans les formulaires.
- Les actions sensibles (suspension, suppression, régénération de QR code)
  exigent une confirmation explicite.

---

## Conventions de développement (workflow d'équipe)

Le détail complet est dans `docs/Conventions de développement.md`. Résumé :

- **Branches** : `type/description-courte-FO-xx` ou `-BO-xx`, en minuscules,
  mots séparés par des tirets, sans accents.
  Exemple : `feat/validation-don-FO-07`
  Une branche par tâche, **jamais de commit direct sur `main`**.
- **Commits** : `type(portée): description` en français, style
  [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
  Exemple : `feat(don): saisie et validation du code anonyme`
  - Types : `feat` / `fix` / `refactor` / `test` / `docs` / `chore` / `style`
  - `refactor` ne change jamais le comportement. Si le comportement change,
    c'est `feat` ou `fix`.
  - `style` = mise en forme du code, jamais du design d'interface.
- **Tâches ClickUp** : `[OFFICE] [Module] - Titre`
  Exemple : `[FO-07] [Don] - Validation de mon don via le code`
  - Office : `[FO]` = FrontOffice (application donneurs) · `[BO]` = BackOffice
  - Modules : Don, Quiz, Collection, Gamification, Profil, Accueil, Auth,
    Stocks, Navigation, DesignSystem
- **Pull Requests** : une PR par branche, ouverte vers `dev`, titre calqué sur
  le commit, relecture par l'autre développeuse avant merge, branche supprimée
  après merge.
- **Definition of Done** : critères d'acceptation cochés, tests écrits et
  passants, code relu via la PR, `main` toujours vert après merge.

### Couverture de tests visée

| Domaine | Cible |
|---|---|
| Logique de gamification | 80 % |
| Endpoints d'authentification | 90 % |
| Endpoint de scan QR | 80 % |

### Qualité du code

- Laravel Pint (formatage)
- PHPStan (analyse statique)

---

## Décisions encore ouvertes

Ne pas trancher seul sur ces points — demander avant d'implémenter :

- **Modèle du QR code** : fixe (réutilisable au centre) ou à usage unique.
  Impacte directement le service de scan et le backoffice.
- **Quota de dons** : les règles de quota dépendent du sexe, qui est une donnée
  sensible incompatible avec l'anonymat strict. Ne rien stocker en attendant
  l'arbitrage.
- **Nom de l'application** : « Aïma » est pressenti mais non validé.
- **Nom de l'association** : ADSB-NC / CDS ou ACDO-NC / CNT — les documents
  de cadrage se contredisent.