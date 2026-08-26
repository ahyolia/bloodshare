# DevOps — BloodShare

Documentation DevOps du projet BloodShare (app mobile de sensibilisation au don du sang en Nouvelle-Calédonie pour l'association ADSB-NC) : architecture Docker, variables d'environnement, workflow Git, mobile Expo, monitoring.

> Le déploiement en production n'est pas encore défini à ce stade — cette section sera ajoutée ultérieurement.

---

## 1. Architecture Docker

Le projet tourne entièrement en Docker (3 services), orchestrés par `docker-compose.yml` à la racine du repo.

| Service | Image | Port local | Rôle |
|---|---|---|---|
| `backend` (`bloodshare_backend`) | build local (`bloodshare-backend/Dockerfile`, PHP 8.3-cli) | 8000 | API Laravel + Backoffice Filament |
| `db` (`bloodshare_db`) | `postgres:15-alpine` | 5433 → 5432 | Base de données PostgreSQL |
| `pgadmin` (`bloodshare_pgadmin`) | `dpage/pgadmin4` | 5050 → 80 | Interface d'administration de la BDD |

### Dockerfile du backend

```dockerfile
FROM php:8.3-cli

RUN apt-get update --fix-missing && apt-get install -y \
    git curl zip unzip libpq-dev libicu-dev libzip-dev libpng-dev libjpeg-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_pgsql intl zip gd

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
```

Pourquoi ces extensions PHP :

| Extension | Pourquoi |
|---|---|
| `pdo_pgsql` | Pilote PDO pour se connecter à PostgreSQL depuis Laravel (Eloquent) |
| `intl` | Formatage des dates, nombres et chaînes localisées (fr-FR) |
| `zip` | Lecture/écriture d'archives ZIP, requis par certaines dépendances Composer |
| `gd` | Traitement d'images (redimensionnement, upload avatars/visuels de badges) |

### Commandes Docker utiles

| Commande | Effet |
|---|---|
| `docker compose up -d` | Démarre les 3 services en arrière-plan |
| `docker compose logs -f backend` | Suit les logs du backend en temps réel |
| `docker exec -it bloodshare_backend php artisan <commande>` | Exécute une commande Artisan dans le conteneur |
| `docker exec -it bloodshare_backend composer <commande>` | Exécute une commande Composer dans le conteneur |
| `docker exec -it bloodshare_backend bash` | Ouvre un shell interactif dans le conteneur |
| `docker compose down` | Arrête et supprime les conteneurs (les volumes sont conservés) |
| `docker compose up --build` | Reconstruit les images puis démarre les services |

### Initialisation de la base de données

```bash
docker exec -it bloodshare_backend php artisan migrate
docker exec -it bloodshare_backend php artisan db:seed
docker exec -it bloodshare_backend php artisan make:filament-user
```

---

## 2. Variables d'environnement

```bash
cp bloodshare-backend/.env.example bloodshare-backend/.env
```

### Variables obligatoires (développement)

| Variable | Valeur dev | Explication |
|---|---|---|
| `APP_ENV` | `local` | Environnement d'exécution Laravel |
| `APP_DEBUG` | `true` | Affiche les erreurs détaillées (jamais en prod) |
| `APP_URL` | `http://localhost:8000` | URL de base utilisée par Laravel (liens, assets) |
| `DB_CONNECTION` | `pgsql` | Pilote de base de données |
| `DB_HOST` | `db` | Nom du service Docker de la BDD (résolu via le réseau Compose) |
| `DB_PORT` | `5432` | Port interne PostgreSQL (dans le réseau Docker) |
| `DB_DATABASE` | `bloodshare` | Nom de la base |
| `DB_USERNAME` | `bloodshare` | Utilisateur PostgreSQL |
| `DB_PASSWORD` | `bloodshare123` | Mot de passe PostgreSQL |
| `MAIL_MAILER` | `log` | En dev, les emails sont écrits dans les logs plutôt qu'envoyés |
| `MAIL_FROM_ADDRESS` | `noreply@bloodshare.local` | Adresse expéditeur par défaut |

### Vérification de la configuration

```bash
docker exec -it bloodshare_backend php artisan config:show
```

---

## 3. Workflow Git

### Schéma des branches

```
main
 ├── feat/...      (nouvelle fonctionnalité)
 ├── fix/...        (correction de bug)
 ├── refacto/...    (refactorisation, sans changement de comportement)
 └── chore/...      (tâches techniques, config, dépendances)
```

**Règle absolue : jamais de commit direct sur `main`.** Toute modification passe par une branche dédiée puis une Pull Request.

### Convention de nommage des branches

Format : `type/description-courte-US-xx`

Exemples réels du projet :
- `feat/mobile-auth-signup`
- `feat/gamification-categories-cartes`
- `fix/sanctum-auth-guard`
- `feat/liste-parcours-quiz-FO-13`

### Convention Conventional Commits

Format : `type(portée): description` en français.

| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refacto` | Refactorisation, sans changement de comportement |
| `chore` | Tâches techniques, config, dépendances |
| `docs` | Documentation |
| `style` | Formatage, sans impact sur la logique |
| `test` | Ajout ou modification de tests |

Exemples réels du projet :
- `feat(quiz): liste des parcours quiz`
- `chore(contributing): add note about merging to main branch`
- `chore(claude): ajout de la commande pullrequest (/pr)`

### Workflow de Pull Request (7 étapes)

1. Créer une branche depuis `main` (ou `dev` selon la cible du merge)
2. Développer et committer sur cette branche
3. Pousser la branche vers GitHub (`git push -u origin <branche>`)
4. Ouvrir une Pull Request vers `dev`
5. Relecture obligatoire par un(e) autre membre de l'équipe
6. Merge de la PR une fois validée
7. Suppression de la branche après merge

### Definition of Done — checklist avant merge

- [ ] Critères d'acceptation de l'US cochés
- [ ] `tsc --noEmit` propre (côté mobile)
- [ ] `php artisan test` passant (côté backend)
- [ ] Code relu par un(e) autre membre de l'équipe
- [ ] Build de `main` toujours vert après merge
- [ ] Branche supprimée après merge

---

## 4. Application mobile Expo

### Démarrage local

```bash
cd bloodshare-mobile
npm install
npx expo start --tunnel
```

### Configuration de l'API selon l'environnement

Dans `bloodshare-mobile/constants/api.ts`, l'URL de l'API doit pointer, en développement, vers l'IP locale de la machine hébergeant le backend Docker (ex. `http://192.168.x.x:8000`). L'URL de production sera définie une fois l'hébergement choisi.

### Build d'un APK Android via EAS Build

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

---

## 5. Monitoring et maintenance

### Vérifications en développement

```bash
docker ps
docker compose logs -f
docker stats
```

### Sauvegarde de la base de données

```bash
pg_dump -h <host> -U bloodshare -d bloodshare -F c -f "bloodshare_backup_$(date +%Y-%m-%d).dump"
```

La stratégie de sauvegarde en production sera précisée une fois l'hébergement choisi.

---

Documentation maintenue par l'équipe BloodShare.
Dernière mise à jour : août 2026.
