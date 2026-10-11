# DevOps — Aïma

Documentation DevOps du projet Aïma (app mobile de sensibilisation au don du sang en Nouvelle-Calédonie pour l'association ADSB-NC) : architecture Docker, variables d'environnement, workflow Git, mobile Expo, monitoring.

> Le déploiement en production n'est pas encore défini à ce stade — cette section sera ajoutée ultérieurement.

---

## 1. Architecture Docker

Le projet tourne entièrement en Docker (4 services), orchestrés par `docker-compose.yml` à la racine du repo.

| Service | Image | Port local | Rôle |
|---|---|---|---|
| `backend` (`bloodshare_backend`) | build local (`bloodshare-backend/Dockerfile`, PHP 8.3-cli) | 8000 | API Laravel + Backoffice Filament |
| `scheduler` (`bloodshare_scheduler`) | même image que `backend` | — | Exécute les tâches planifiées (`php artisan schedule:work`) |
| `db` (`bloodshare_db`) | `postgres:15-alpine` | 5433 → 5432 | Base de données PostgreSQL |
| `pgadmin` (`bloodshare_pgadmin`) | `dpage/pgadmin4` | 5050 → 80 | Interface d'administration de la BDD |

### Service `scheduler`

`bootstrap/app.php` déclare les tâches planifiées (`->withSchedule(...)`), mais cette
déclaration seule ne fait rien tourner : il faut un process qui reste actif et les
exécute. `backend` ne lance que `php artisan serve` (voir `entrypoint.sh`) — sans le
service `scheduler` (`php artisan schedule:work`), aucune tâche planifiée (notifications
automatiques, etc.) ne se déclenche jamais, silencieusement.

**Sur Dokploy**, il n'y a pas de `docker-compose.yml` lu directement : dupliquer le
service `backend` en créant un second service dans l'application Dokploy, avec :
- la même image/build que `backend`
- la commande de démarrage remplacée par `php artisan schedule:work`
- aucun port exposé
- les mêmes variables d'environnement que `backend`

Vérifier qu'il tourne : `docker logs <conteneur scheduler>` doit afficher les tâches
exécutées aux heures prévues (`php artisan schedule:list` liste les horaires).

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
| `bcmath` | Calculs grands nombres pour la signature VAPID des notifications push (`minishlink/web-push`) — sans elle, l'avertissement qu'elle lève est transformé par Laravel en erreur 500 à chaque envoi |

### Commandes Docker utiles

| Commande | Effet |
|---|---|
| `docker compose up -d` | Crée et démarre les 3 services en arrière-plan (première fois, ou après un changement de config/Dockerfile) |
| `docker compose start` | Redémarre les conteneurs existants sans les recréer (usage quotidien, plus rapide) |
| `docker compose stop` | Arrête les conteneurs sans les supprimer (préféré à `down` pour un usage quotidien) |
| `docker compose logs -f backend` | Suit les logs du backend en temps réel |
| `docker exec -it bloodshare_backend php artisan <commande>` | Exécute une commande Artisan dans le conteneur |
| `docker exec -it bloodshare_backend composer <commande>` | Exécute une commande Composer dans le conteneur |
| `docker exec -it bloodshare_backend bash` | Ouvre un shell interactif dans le conteneur |
| `docker compose down` | Arrête et supprime les conteneurs (les volumes sont conservés) — à réserver aux cas où il faut repartir de zéro |
| `docker compose up --build` | Reconstruit les images puis démarre les services |

### Initialisation de la base de données

```bash
docker exec -it bloodshare_backend php artisan migrate
docker exec -it bloodshare_backend php artisan db:seed
docker exec -it bloodshare_backend php artisan make:filament-user
```

### Base de test (`bloodshare_testing`)

`phpunit.xml` fait tourner `php artisan test` contre une base Postgres **séparée**
(`bloodshare_testing`, même instance), pour que `RefreshDatabase` ne vide jamais la
vraie base de dev.

Sur un volume `postgres_data` neuf, `docker-entrypoint-initdb.d` (monté dans
`docker-compose.yml`) la crée automatiquement au premier démarrage du conteneur `db` —
rien à faire. Ce dossier ne s'exécute **que** sur un volume vide : si le volume existe
déjà (mise à jour d'un poste existant), la créer à la main une fois :

```bash
docker exec bloodshare_db createdb -U bloodshare bloodshare_testing
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

L'adresse du backend n'est pas versionnée : chaque poste la définit dans `bloodshare-mobile/.env.local`, à partir du modèle fourni.

```bash
cd bloodshare-mobile
cp .env.example .env.local
```

Renseigner `EXPO_PUBLIC_API_URL` avec une adresse joignable **depuis l'appareil qui exécute l'app** — sur un téléphone, `localhost` désigne le téléphone lui-même, jamais la machine de dev. Trois cas, le backend écoutant sur le port 8000 (`docker compose up -d`) :

| Situation | Valeur |
| --- | --- |
| Téléphone sur le même réseau que le PC | `http://192.168.x.x:8000/api` — IP LAN du PC |
| Réseau qui isole les appareils entre eux (Wi-Fi d'établissement) | `https://<tunnel>.ngrok-free.dev/api` — voir `ngrok http 8000` |
| Émulateur iOS ou test web | `http://localhost:8000/api` |

Vérifier qu'on cible bien **son** backend et pas celui d'un autre poste :

```bash
curl -H "ngrok-skip-browser-warning: 1" <url>/api/stock-sang
```

> ⚠️ Après toute modification de `.env.local`, relancer le bundler avec `npx expo start -c`.
> Les variables `EXPO_PUBLIC_*` sont inlinées dans le bundle au moment de la transformation, et Metro
> conserve les modules transformés en cache : sans le `-c`, l'ancienne valeur reste active. Cela ne
> concerne que ce fichier — le code applicatif continue de se recharger instantanément (Fast Refresh).

Au démarrage, l'app affiche en console `[api] URL utilisée : …`, et avertit explicitement si `EXPO_PUBLIC_API_URL` est absent — auquel cas elle se replie sur `localhost`, injoignable depuis un téléphone.

L'URL de production sera définie une fois l'hébergement choisi.

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

### Images envoyées depuis le backoffice (déploiement Dokploy)

Les images téléversées dans le BO (badges, cartes, actualités, événements) sont écrites dans
`storage/app/public` **à l'intérieur du conteneur**. Sans volume persistant, chaque
redéploiement recrée le conteneur et **efface toutes ces images**, alors que la base garde leurs
chemins : l'app affiche alors des images cassées et il faut tout renvoyer.

Sur Dokploy, monter un volume sur ce dossier (service backend → *Advanced* → *Volumes / Mounts*) :

| Champ | Valeur |
| --- | --- |
| Type | Volume |
| Nom | `bloodshare-storage` |
| Chemin dans le conteneur | `/var/www/html/storage/app/public` |

Vérification après redéploiement : `docker inspect <conteneur> --format '{{json .Mounts}}'` doit
lister ce volume (un résultat `[]` signifie que les images seront perdues au prochain déploiement).
En local, `docker-compose.yml` monte déjà le dépôt en volume : rien à faire.

---

Documentation maintenue par l'équipe Aïma.
Dernière mise à jour : août 2026.
