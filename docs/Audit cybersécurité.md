# Audit de cybersécurité — Application Aïma

> Audit réalisé du 21/10/2026 sur la branche `fix/audit-cybersecurite-US-29` (US-29), à partir
> de `dev`. Périmètre : API Laravel, backoffice Filament, application mobile et PWA, configuration
> Docker et Dokploy, historique git. Complète la [grille d'audit RGPD](Grille%20d'audit%20RGPD%20-%20Application%20mobile.md)
> et l'[AIPD](AIPD%20-%20Suivi%20des%20dons.md).
>
> Gravité : 🔴 haute (compte, données ou serveur compromis) · 🟠 moyenne (triche, fuite limitée,
> contournement d'une règle) · 🟡 faible (durcissement, impact indirect)

## Synthèse

**19 failles trouvées et corrigées pendant l'US-29**, dont 6 hautes. Chacune a été reproduite
avant d'être corrigée, et chaque correction du code est couverte par un test automatisé qui
échoue sans elle (la faille 19, corrigée dans la config de prod, a été vérifiée sur l'API). Les
304 tests backend passent à la fin de l'audit.

| Gravité | Nombre | Failles |
| --- | --- | --- |
| 🔴 Haute | 6 | Suspension sans effet · dump SQL public · XSS par image SVG · admin qui exclut le super_admin · SSRF par les notifications push · limite de connexion contournable |
| 🟠 Moyenne | 8 | QR centre fixe · images sans limites · questions médicales modifiables · triche au quiz · sessions conservées après changement de mot de passe · données des comptes dans les journaux · double don · mot de passe public sur la base de prod |
| 🟡 Faible | 5 | Configuration de production · erreur 500 au scan · textes sans longueur max · actions d'un admin sur son propre compte · API sans limite de requêtes |

Des analyses automatiques tournent désormais sur chaque PR (dépendances, secrets, analyse
statique, droits du BO, routes de l'API) : voir [Analyses automatiques](#analyses-automatiques).

## Méthode

| Technique | Ce qu'elle a trouvé |
| --- | --- |
| **Relecture du code** guidée par l'OWASP Top 10 (contrôle d'accès, authentification, injection, configuration) | Suspension sans effet, triche au quiz, SSRF, sessions conservées, dump SQL |
| **Reproduction en conditions réelles** sur le backend local : requêtes parallèles, en-têtes falsifiés, abonnement push piégé | Double don (5 dons pour 8 scans), erreur 500 cachée, SSRF prouvée, limite de connexion contournée |
| **Tests écrits avant la correction** avec de vrais fichiers malveillants (SVG avec script, PNG piégé, image géante) | 6 types de fichiers dangereux acceptés par le BO |
| **Sonde des droits** : chaque page du BO appelée en admin et en super_admin, URL directes comprises | Admin capable de suspendre le super_admin, questions médicales modifiables |
| **Outils** : gitleaks, npm audit, composer audit, Semgrep | Données de comptes dans les journaux, inventaire des dépendances vulnérables |
| **Vérification des données réelles** (local et prod, en lecture seule) | Aucun abus passé, aucune image dangereuse stockée, prod correctement configurée sauf le mot de passe de la base |
| **Comparaison des secrets de prod aux valeurs publiques du dépôt**, sans afficher aucun secret (seule l'égalité est testée) | Mot de passe public `bloodshare123` encore configuré sur la base de prod |

## Failles corrigées dans l'US-29

### Comptes et authentification

| # | Gravité | Faille | Comment on l'a trouvée | Correction | Commit |
| --- | --- | --- | --- | --- | --- |
| 1 | 🔴 | **La suspension d'un compte n'avait aucun effet.** `login()` ignorait le statut, les tokens restaient valables, un admin suspendu gardait l'accès au BO. | Relecture du code : le statut n'était lu nulle part | `User::suspendre()` révoque les tokens ; refus au login (403), sur toute l'API (middleware) et dans le BO (`canAccessPanel`) | `c4fab6fbc` |
| 2 | 🔴 | **Limite de tentatives de connexion contournable**, sur l'API et sur le BO, en changeant l'en-tête `X-Forwarded-For` (accepté à cause de `trustProxies('*')`). | Reproduit : 8 tentatives avec 8 IP inventées, aucune bloquée | Limite par compte visé : 6/min sur l'API, 5 échecs puis 15 min de blocage sur le BO | `c1180a8c4` |
| 3 | 🟠 | **Changer de mot de passe ne déconnectait pas les autres appareils** : un token volé restait valable. | Relecture du code, puis test | Les autres tokens sont révoqués, la session en cours est gardée | `33eadd8f7` |
| 4 | 🟡 | **Aucune limite de requêtes** sur la plupart des routes (scan, quiz, notifications). | Relecture des routes | 120 requêtes/min par utilisateur connecté, 300/min par IP sinon | `c1180a8c4` |

### Scan et gamification

| # | Gravité | Faille | Comment on l'a trouvée | Correction | Commit |
| --- | --- | --- | --- | --- | --- |
| 5 | 🟠 | **QR Code du centre fixe** : une photo partagée permettait de valider un don depuis chez soi (carte, badges, parrainage, défi). | Signalée par l'AIPD | QR tournant (30 s) sur un écran du centre, ouvert par un lien signé. QR de secours imprimable, accepté seulement pendant un mode secours activé dans le BO (jusqu'à 23h59) | `50e3857ac` |
| 6 | 🟠 | **Double don** : des scans simultanés passaient tous le contrôle d'éligibilité. | Reproduit : 8 scans parallèles ont créé 5 dons | Verrou sur la ligne utilisateur pendant le scan | `7b00d9a65` |
| 7 | 🟡 | **Erreur 500 au scan** : la protection existante contre les doublons ne fonctionnait pas sous PostgreSQL (transaction annulée). | Découverte en reproduisant la faille 6 | Création dans un *savepoint* | `7b00d9a65` |
| 8 | 🟠 | **Triche au quiz** : renvoyer la même bonne réponse en boucle augmentait le score sans limite. | Relecture, puis test : 1 000 points pour un quiz qui en vaut 40 | Chaque question n'est comptée qu'une fois. Aucun abus trouvé en base | `3d00f237b` |

### Backoffice

| # | Gravité | Faille | Comment on l'a trouvée | Correction | Commit |
| --- | --- | --- | --- | --- | --- |
| 9 | 🔴 | **XSS stockée par une image SVG** : `->image()` acceptait tout `image/*`, et le SVG était servi depuis le domaine du BO. | Test avec un SVG contenant `<script>` : accepté | Champ `ChampImage` commun : JPEG, PNG ou WebP uniquement, vérifiés sur le contenu | `cf3a314a1` |
| 10 | 🟠 | **Images sans limites** : 10 000 px ou plus de 2 Mo acceptés, métadonnées et code caché conservés tels quels. | Tests avec une image géante, une image lourde et un PNG cachant du PHP | 2 Mo et 4 000 px au plus, réencodage en WebP 1 600 px sans métadonnées, nom aléatoire | `cf3a314a1` |
| 11 | 🔴 | **Un admin pouvait suspendre ou supprimer le super_admin** depuis « Utilisateurs », qui listait aussi les comptes du BO. Rendue grave par la correction de la faille 1. | Sonde des droits sur toutes les pages du BO | « Utilisateurs » ne liste que les donneurs (404 sur un compte du BO) | `a52c6c038` |
| 12 | 🟠 | **Questions d'éligibilité** (médicales) créables et supprimables en masse par un admin, qui ne doit que les activer ou les désactiver. | Sonde des droits | Création et suppression réservées au super_admin | `a52c6c038` |
| 13 | 🟡 | Le super_admin pouvait **se suspendre ou se supprimer**, et supprimer un admin **effaçait la ligne** au lieu de l'anonymiser. | Sonde des droits | Actions masquées sur son propre compte, suppression par `anonymiser()` | `a52c6c038` |
| 14 | 🟡 | **Textes sans longueur maximale** (9 champs), renvoyés à chaque appel de l'API. | Relecture des formulaires | Limites de 300 à 50 000 caractères, fixées après mesure de l'existant | `e1d3ef8cc` |

### API, serveur et données

| # | Gravité | Faille | Comment on l'a trouvée | Correction | Commit |
| --- | --- | --- | --- | --- | --- |
| 15 | 🔴 | **SSRF par les notifications push** : l'adresse d'abonnement était libre, et le serveur y envoie une requête à chaque notification (panel Dokploy, base, services internes). | Prouvé : un abonnement vers `http://127.0.0.1:8000/preuve-ssrf-aima` a fait appeler cette URL par le serveur | Seuls les services de push des navigateurs (Google, Mozilla, Apple, Microsoft) sont acceptés, en HTTPS | `e02b1a1d0` |
| 16 | 🔴 | **Dump SQL public** : `bloodshare_backup.sql` (email et hash bcrypt d'un compte) versionné de juin à octobre dans un dépôt public. La grille RGPD le donnait à tort pour conforme. | Relecture des fichiers suivis par git | Fichier retiré, `*.sql` ignoré, règle gitleaks dédiée. Compte supprimé, historique non réécrit (décision d'équipe) | `c280d3f74` |
| 17 | 🟠 | **Données des comptes dans les journaux** : une erreur SQL écrivait l'email, le hash et toute la ligne (sexe compris), gardés 180 jours. | gitleaks sur le dossier de travail : 7 hashs dans `laravel.log` (comptes de test, aucun en prod) | Les erreurs SQL sont journalisées sans leurs valeurs | `fc724cad0` |
| 18 | 🟡 | **Configuration de production** : rien n'empêchait un déploiement avec le debug actif ou les mots de passe de dev, cookie de session non `Secure`, base et pgAdmin locaux ouverts au réseau, aucun en-tête de sécurité HTTP. | Lecture de la config Dokploy (debug désactivé, mais voir la faille 19) et de `docker-compose.yml` | Le conteneur refuse de démarrer en production avec une config dangereuse, cookie `Secure`, ports locaux sur `127.0.0.1`, en-têtes `nosniff`, `SAMEORIGIN`, `Referrer-Policy`, HSTS | `890201537` |
| 19 | 🟠 | **Mot de passe public sur la base de prod** : le service `bloodshare-db` de Dokploy était configuré avec `bloodshare123`, le mot de passe de dev publié dans `docker-compose.yml` (dépôt public). La base n'est pas exposée hors du réseau Docker, mais une SSRF (faille 15) ou un autre conteneur compromis suffisait à l'ouvrir. | Comparaison des variables de chaque service Dokploy aux valeurs publiques du dépôt (`APP_KEY`, clés VAPID et mot de passe du backend : propres) | Rotation : nouveau mot de passe aléatoire de 40 caractères appliqué par `ALTER USER`, reporté dans Dokploy (backend, scheduler, base), redéploiement. API vérifiée après coup (route lisant la base : 200) | Prod (hors code) |

La faille 1 comprend aussi le téléchargement du QR centre, qui acceptait toute session ouverte
(même sans accès au BO).

## Failles corrigées avant l'US-29

| Faille | Comment on l'a trouvée | Correction | PR |
| --- | --- | --- | --- |
| Un compte supprimé pouvait se reconnecter, puis l'anonymisation était incomplète | Test du parcours, critère RGPD, revue de code | Anonymisation complète en transaction, migration de rattrapage | #64, #67, #104, #106 |
| Force brute sur l'inscription et la connexion | Revue de code | Limites de tentatives, emails normalisés | #83 |
| Un admin pouvait réinitialiser le mot de passe d'un autre admin, les sessions survivaient au reset | Revue de code | Reset réservé aux donneurs, tokens révoqués | #92 |
| Mot de passe en clair dans la console du navigateur | Audit RGPD | Seul le code HTTP est affiché, en dev | #111 |
| Tokens sans expiration, stockés dans le `localStorage` de la PWA | Audit RGPD | Expiration à 90 jours, purge quotidienne | #111 |
| Consentements vérifiés seulement côté mobile | Conception de l'US-28 | Vérifiés par l'API | #105 |
| QR d'événement annulé accepté, rescans illimités, quiz raté payé comme réussi | Rapport de vérification de l'API, tests | Contrôles de statut et de date, une participation par événement, points proportionnels | #61, #71, #101 |
| Mode *stateful* de Sanctum sur l'API | Revue | API par jeton Bearer uniquement | #82 |

## Vérifié, sans faille

- **IDOR** : la seule ressource adressée par un identifiant (les notifications) est filtrée sur
  l'utilisateur connecté. Dons, cartes, badges et points concernent toujours ce dernier.
- **Mass assignment** : statut, points, email, rôle et version des CGU ne sont modifiables ni par
  `PUT /me` ni à l'inscription (`ChampsProtegesApiTest`).
- **Injection de script par les textes** : Filament échappe tout dans le BO (pseudo piégé
  compris), l'app affiche les textes dans des `<Text>` qui n'interprètent pas le HTML, aucun champ
  du BO ne fournit d'URL à ouvrir.
- **Injection SQL** : toutes les requêtes passent par Eloquent (requêtes préparées). Le contenu
  d'une image envoyée n'est jamais placé dans une requête.
- **Bonnes réponses des quiz** : jamais envoyées à l'app.
- **Production Dokploy** : `APP_DEBUG=false`, `APP_KEY` et clés VAPID propres à la prod et jamais commitées, base non exposée hors du réseau Docker.

## Risques acceptés ou reportés

| Risque | Décision | Justification |
| --- | --- | --- |
| Dump SQL toujours présent dans l'historique git public | Accepté | Le compte n'existe plus. Réécrire l'historique d'un dépôt partagé casserait les clones et les PR ouvertes |
| CORS ouvert à toutes les origines | Accepté | API par jeton, sans cookies (`supports_credentials=false`) : un site tiers ne peut rien lire sans le jeton |
| `trustProxies('*')` | Accepté | Sur Dokploy, le réseau Swarm masque l'IP réelle : restreindre les proxies ne suffirait pas. Les limites par compte (faille 2) compensent |
| Inscription limitée par IP seulement | Accepté | Contournable pour créer des comptes en masse, sans accès aux comptes existants |
| Token dans le `localStorage` de la PWA | Accepté | Pas d'alternative sur le web sans changer l'authentification. Expiration à 90 jours |
| Photo du QR tournant relayée en direct | Accepté | Fenêtre d'une minute au plus, contre un QR valable indéfiniment auparavant |
| 5 dépendances npm vulnérables | Accepté | 4 servent seulement aux outils de build et de test. La 5ᵉ (`decode-uri-component`) peut figer l'onglet de la victime, sans accès aux données. Détail dans `bloodshare-mobile/audit-ci.jsonc` |
| En-tête CSP sur la PWA | Reporté | À tester dans un navigateur réel (polices, push, appels à l'API) pour ne pas casser l'app |
| Double authentification du BO, journal des actions des admins | Reporté en V2 | Déjà prévus par l'audit RGPD |

## Analyses automatiques

Workflow `.github/workflows/securite.yml`, sur chaque PR et chaque push vers `dev`/`main`, et
chaque semaine. Les tests de sécurité tournent avec les autres dans `tests.yml`.

| Analyse | Outil | Bloquante |
| --- | --- | --- |
| Failles connues des dépendances PHP | `composer audit` | Oui |
| Failles connues des dépendances npm | `audit-ci` (exceptions justifiées dans `audit-ci.jsonc`) | Oui, hautes et critiques |
| Secrets dans l'historique git | gitleaks + règle hash bcrypt (`.gitleaks.toml`, `.gitleaksignore`) | Oui |
| Motifs de code dangereux | Semgrep, règles PHP, TypeScript, React | Oui |
| Droits de chaque page du BO | `RolesBackofficeTest` : une page non classée fait échouer | Oui |
| Connexion exigée sur chaque route de l'API | `RoutesApiTest` : une route non classée fait échouer | Oui |
| Mises à jour de dépendances | Dependabot, PR hebdomadaires vers `dev` | Non (PR à relire) |

## Actions restantes

| Action | Qui |
| --- | --- |
| Sur Dokploy : ne pas exposer le port `8001` (backend en HTTP) sur Internet, le retirer s'il ne sert pas | Équipe |
| À chaque nouveau secret de prod : générer une valeur aléatoire, jamais reprendre une valeur du dépôt | Équipe |
| Ouvrir le lien de l'écran du centre sur la tablette du centre, imprimer le QR de secours | ADSB-NC |
| Activer les alertes Dependabot (Settings → Code security) | Propriétaire du dépôt |
| Tester puis ajouter un en-tête CSP sur la PWA | Équipe, V1 si le temps le permet |
| Revoir les exceptions d'`audit-ci.jsonc` à chaque montée de version d'Expo | Équipe |
| Double authentification et journal des actions des admins | V2 |

## Enseignements

- **Ne jamais faire confiance au client** : score de quiz, adresse de push, en-tête
  `X-Forwarded-For`, type de fichier. Chaque valeur venue de l'extérieur doit être vérifiée par le
  serveur.
- **Une correction peut en rendre une autre urgente** : la suspension (faille 1) a donné son
  poids à la faille 11. Il faut retester les droits après chaque changement.
- **Le code « protégé » doit être testé** : la protection contre les doublons du scan existait
  mais ne marchait pas sous PostgreSQL (faille 7).
- **Les outils ne trouvent pas tout** : aucun outil n'aurait vu la suspension sans effet, et
  gitleaks ne voyait pas le dump SQL sans règle dédiée. La revue de code reste indispensable.
- **Changer la variable ne change pas le mot de passe** : Postgres ne lit `POSTGRES_PASSWORD`
  qu'à la création de la base. Pour une rotation, il faut `ALTER USER`, puis reporter la même
  valeur partout où elle est utilisée.
- **Sécurité et RGPD se recoupent** : 4 des failles (16, 17, 9, 10) exposaient des données
  personnelles.
