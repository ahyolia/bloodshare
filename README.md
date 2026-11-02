# Aïma 🩸

Application mobile gamifiée de sensibilisation et fidélisation des donneurs de sang en Nouvelle-Calédonie, développée pour l'association ADSB-NC.

## Concept

Aïma encourage les non-donneurs à passer à l'acte et fidélise les donneurs existants par la gamification :

- **Points** : gagnés uniquement en complétant des quiz ou en parrainant quelqu'un qui fait son premier don.
  **Un don ne rapporte jamais de points** (règle éthique ADSB-NC).
- **Cartes-souvenirs** : un don validé au centre donne la carte du mois ; la présence à un événement donne
  une carte Événement. Pas de tirage aléatoire.
- **Badges** : débloqués par l'engagement (dons, événements, quiz, parrainage).

Le détail des règles est dans [docs/doc_gamification.md](docs/doc_gamification.md).

## Stack technique

| Composant | Technologie |
|---|---|
| Application mobile | React Native (Expo) |
| Backend & API REST | Laravel 12 + Sanctum |
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
| [DEVOPS.md](DEVOPS.md) | Architecture Docker, workflow Git, déploiement sur le serveur de démo (section 6) |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Branches, commits, Pull Requests, Definition of Done |
| [docs/contrat_API.md](docs/contrat_API.md) | Format des endpoints API mobile |
| [docs/doc_gamification.md](docs/doc_gamification.md) | Règles des points, cartes, badges, défis et quiz |
| [docs/guide_mobile_bloodshare.md](docs/guide_mobile_bloodshare.md) | Guide de l'application mobile |
| [docs/Audit cybersécurité.md](<docs/Audit cybersécurité.md>) | Audit de cybersécurité de l'application |
| [docs/Grille d'audit RGPD - Application mobile.md](<docs/Grille d'audit RGPD - Application mobile.md>) | Grille d'audit RGPD |
| [docs/AIPD - Suivi des dons.md](<docs/AIPD - Suivi des dons.md>) | Analyse d'impact relative à la protection des données (suivi des dons) |
| [docs/Dossier juridique prérempli — application AÏMA.docx.md](<docs/Dossier juridique prérempli — application AÏMA.docx.md>) | Dossier juridique (CGU, confidentialité, mentions légales) |
| [docs/bloodshare_arborescence.pdf](docs/bloodshare_arborescence.pdf) | Arborescence de l'application |
| [bloodshare-backend/README.md](bloodshare-backend/README.md) | Documentation backend |
| [bloodshare-mobile/README.md](bloodshare-mobile/README.md) | Documentation mobile |

## Liens du projet

| Élément | Lien |
|---|---|
| Application web (PWA, démo) | https://aima-nc.netlify.app |
| Expérience VR (dépôt) | https://github.com/nevizsh/bloodshare-vr |
| Roue de la chance (dépôt) | https://github.com/nevizsh/aima-roue |

Il n'y a pas d'APK publié pour la V1. L'application s'utilise en PWA (lien ci-dessus, installable
depuis le navigateur du téléphone) ou en développement avec Expo Go (voir
[Lancer l'appli mobile](#lancer-lappli-mobile)). La commande pour produire un APK est dans
[DEVOPS.md, section 4](DEVOPS.md#build-dun-apk-android-via-eas-build).

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

**Backoffice** : http://localhost:8000/admin avec le compte **super admin** `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` (définis dans `bloodshare-backend/.env`, par défaut
`super.admin@bloodshare.local` / `Admin-local-1234`).

Comptes de test créés en local uniquement :

| Compte | Identifiants | Accès |
|---|---|---|
| Super admin | `super.admin@bloodshare.local` / `Admin-local-1234` | Tout le backoffice |
| Donneur | `test@example.com` / `password` | Application mobile uniquement |

> Cette base est **locale et indépendante** de celle des autres développeur·se·s : ce que vous
> saisissez dans votre backoffice n'apparaît pas dans leur application, et inversement.

## Accès

| Service | URL |
|---|---|
| API Laravel | http://localhost:8000 |
| Backoffice Filament | http://localhost:8000/admin |
| pgAdmin | http://localhost:5050 |

Démo en ligne (hébergement temporaire) : front sur https://aima-nc.netlify.app, API et
backoffice sur https://sae203.hopto.org/~cameliaa. Mise à jour du back ou du front : voir
[DEVOPS.md, section 6](DEVOPS.md#6-déploiement-sur-le-serveur-de-démo-sae203).

## Connexion pgAdmin

- **Email** : admin@local.dev
- **Password** : admin
- **Host** : db / **Port** : 5432 / **User** : bloodshare / **Password** : bloodshare123

## Lancer l'appli mobile

1. Installer l'application **Expo Go** sur le téléphone.
2. Connecter le téléphone et le PC **au même réseau Wi-Fi** (sur un réseau qui isole les appareils,
   comme certains Wi-Fi d'établissement, utiliser un tunnel ngrok : voir
   [DEVOPS.md, section 4](DEVOPS.md#4-application-mobile-expo)).
3. Créer le fichier d'environnement et y mettre l'adresse du backend :

   ```bash
   cd bloodshare-mobile
   cp .env.example .env.local
   ```

   Dans `.env.local`, remplacer `localhost` par l'**IP Wi-Fi du PC** (`ipconfig` sous Windows,
   ligne « Adresse IPv4 » de la carte Wi-Fi ; `ip a` sous Linux) :

   ```
   EXPO_PUBLIC_API_URL=http://192.168.x.x:8000/api
   ```

   Sur un téléphone, `localhost` désigne le téléphone lui-même, pas le PC.
4. Lancer l'application et scanner le QR code avec Expo Go :

   ```bash
   npm install
   npx expo start -c
   ```

   `-c` vide le cache : obligatoire après chaque modification de `.env.local`, sinon l'ancienne
   adresse reste utilisée.

## Lancer les tests

```bash
# Backend (base de test séparée, la base de dev n'est pas touchée)
docker exec -it bloodshare_backend php artisan test

# Mobile
cd bloodshare-mobile
npm test            # tests Jest
npm run typecheck   # vérification TypeScript
npm run lint        # ESLint
```

## Modifier l'application

### Sans coder : le backoffice

La plupart des contenus se modifient dans le backoffice (http://localhost:8000/admin), sans toucher
au code : actualités et fiches pratiques, événements, quiz, cartes, badges, défis du mois, questions
d'éligibilité, stocks de sang, bannière d'urgence, textes juridiques, utilisateurs et admins.

### Dans le code

| Pour modifier… | Où |
|---|---|
| Un écran de l'app | `bloodshare-mobile/app/` (une route = un fichier, [Expo Router](https://docs.expo.dev/router/introduction/)) : onglets dans `app/tabs/` (accueil, `cartes/`, `don/`, `quiz/`, `profil/`), connexion dans `app/auth/` |
| Un composant réutilisable | `bloodshare-mobile/components/` |
| Les couleurs, typographies, espacements | `bloodshare-mobile/constants/` (`colors.ts`, `palette.ts`, `typography.ts`, `spacing.ts`) |
| Les appels à l'API depuis l'app | `bloodshare-mobile/services/` (client commun : `services/api.ts`) |
| Une route de l'API | `bloodshare-backend/routes/api.php`, contrôleurs dans `app/Http/Controllers/Api/` |
| Une règle métier (badges, cartes, parrainage, niveaux, défis, notifications) | `bloodshare-backend/app/Services/` |
| Une table ou une colonne | nouvelle migration : `docker exec -it bloodshare_backend php artisan make:migration ...`, modèle dans `app/Models/` |
| Un écran du backoffice | `bloodshare-backend/app/Filament/Resources/` |
| Les données de départ (cartes, badges, quiz…) | `bloodshare-backend/database/seeders/` |
| Les textes juridiques par défaut | `bloodshare-backend/resources/juridique/` |

Le backend se recharge tout seul (le code est monté dans le conteneur) ; l'app mobile aussi (Fast
Refresh). Après un changement de migration : `docker exec -it bloodshare_backend php artisan migrate`.

Avant de proposer une modification : une branche par tâche, partie de `dev`, puis une Pull Request
vers `dev` (voir [CONTRIBUTING.md](CONTRIBUTING.md)).

## Rôles

| Rôle | Accès |
|---|---|
| `super_admin` | Gestion des admins, paramètres système |
| `admin` | Contenu éditorial, utilisateurs, gamification |
| *(aucun rôle)* | Donneurs : application mobile uniquement (un compte admin est refusé à la connexion mobile) |