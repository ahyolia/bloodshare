# Contrat API

Ce document définit le format exact des requêtes et réponses entre l'application mobile (React Native) et l'API Laravel. Toute modification doit être discutée entre les deux parties avant d'être appliquée.

**Base URL (dev)** : [`http://localhost:8000/api`](http://localhost:8000/api)

**Authentification** : après un `login` ou `register` réussi, l'API renvoie un `token` (une longue chaîne de caractères, ex: `1|xxxxxxxxxxxxxxxxxxxxx`).

Pour tous les appels suivants qui nécessitent d'être connecté (marqués _Authentifié_ dans ce document), ce token doit être renvoyé dans chaque requête, glissé dans un **header HTTP** nommé `Authorization`, sous la forme :

```gherkin
Authorization: Bearer 1|xxxxxxxxxxxxxxxxxxxxx
```

C'est comme ça que le serveur sait quel utilisateur fait la requête, sans avoir à renvoyer l'email/mot de passe à chaque fois. Concrètement côté React Native, ça veut dire :
1. Stocker le `token` reçu après login (dans `expo-secure-store`, pas en clair)
2. L'ajouter dans les headers de chaque appel `axios`/`fetch` qui suit (souvent configuré une seule fois de façon globale, ex: un intercepteur Axios)

Seuls 3 endpoints ne demandent pas ce header car l'utilisateur n'est pas encore identifié à ce moment-là : `register`, `login`, `forgot-password`.

**Format des réponses d'erreur (standard sur tous les endpoints) :**

```json
{
  "message": "Description lisible de l'erreur",
  "errors": {
    "champ": ["Le champ est requis."]
  }
}
```

# 1\. Authentification
## `POST /auth/register`
Crée un nouveau compte utilisateur et connecte directement la personne (renvoie un token utilisable immédiatement, pas besoin de refaire un login après).

**Requête :**

```perl
{
  "pseudo": "BloodHero42",
  "email": "user@example.com",
  "password": "MotDePasse123",
  "password_confirmation": "MotDePasse123",
  "sexe": "homme",
  "groupe_sanguin": "O+",
  "avatar_id": 3,
  "code_parrainage": "ABCD1234"
}
```

> `code_parrainage` est optionnel.

**Réponse 201 :**

```json
{
  "token": "1|xxxxxxxxxxxxxxxxxxxxx",
  "user": {
    "id": 12,
    "pseudo": "BloodHero42",
    "avatar_url": "https://cdn.bloodshare.nc/avatars/3.webp",
    "groupe_sanguin": "O+",
    "points_cumules": 0,
    "code_parrainage": "XYZ98765"
  }
}
```

> `points_cumules` ne reflète que les points gagnés via quiz, défi du mois ou parrainage — jamais via un don ou un événement (voir section 3).

## `POST /auth/login`
Connecte un utilisateur déjà inscrit et renvoie un nouveau token à stocker.

**Requête :**

```perl
{
  "email": "user@example.com",
  "password": "MotDePasse123"
}
```

**Réponse 200 :**

```json
{
  "token": "1|xxxxxxxxxxxxxxxxxxxxx",
  "user": {
    "id": 12,
    "pseudo": "BloodHero42",
    "avatar_url": "https://cdn.bloodshare.nc/avatars/3.webp",
    "groupe_sanguin": "O+",
    "points_cumules": 250,
    "code_parrainage": "XYZ98765"
  }
}
```

**Réponse 401 :**

```json
{ "message": "Email ou mot de passe incorrect." }
```

## `POST /auth/logout`
Invalide le token côté serveur. À appeler quand l'utilisateur clique sur "Se déconnecter" — penser aussi à effacer le token stocké localement sur le téléphone. _Authentifié._ Aucune requête body.
**Réponse 200 :**

```json
{ "message": "Déconnexion réussie." }
```

## `POST /auth/forgot-password`
Envoie un email avec un lien de réinitialisation de mot de passe à l'adresse fournie (si elle existe en base).
**Requête :**

```perl
{ "email": "user@example.com" }
```

**Réponse 200 :**

```json
{ "message": "Email de réinitialisation envoyé." }
```

# 2\. Profil
## `GET /me`
Récupère les informations complètes du profil de l'utilisateur actuellement connecté — à appeler typiquement à l'ouverture de l'app ou sur l'écran Profil. _Authentifié._
**Réponse 200 :**

```json
{
  "id": 12,
  "pseudo": "BloodHero42",
  "avatar_url": "https://cdn.bloodshare.nc/avatars/3.webp",
  "groupe_sanguin": "O+",
  "sexe": "homme",
  "points_cumules": 250,
  "code_parrainage": "XYZ98765",
  "statut": "actif",
  "created_at": "2026-01-15T10:00:00Z",
  "derniere_connexion": "2026-06-20T08:30:00Z"
}
```

## `PUT /me`
Modifie le profil — utilisé sur l'écran "Paramètres / Informations du profil" pour changer le pseudo ou l'avatar. _Authentifié._ Tous les champs sont optionnels (envoyer uniquement ceux à modifier).
**Requête :**

```json
{
  "pseudo": "NouveauPseudo",
  "avatar_id": 5
}
```

**Réponse 200 :** même format que `GET /me`
## `DELETE /me`
Supprime définitivement le compte et toutes les données personnelles associées — à appeler depuis le bouton "Supprimer mon compte" du profil. _Authentifié._ Suppression du compte (RGPD).
**Réponse 200 :**

```json
{ "message": "Compte supprimé avec succès." }
```

# 3\. Scan QR Code
## `POST /scan`
_Authentifié._ Endpoint central — appelé après le scan d'un QR Code (centre ou événement). Le token est celui encodé brut dans le QR Code (pas une URL).
> ⚠️ Le don du sang reste un acte volontaire et gratuit : **aucun point n'est attribué pour un don ou un événement**. L'action donne uniquement une carte-souvenir, attribuée directement (pas de tirage aléatoire, pas de booster).

**Requête :**

```json
{ "token": "rVg5shJKKmRGGZXD08xvFeZsBK8A3UWxgMUGLcxr" }
```

**Réponse 200 — succès (don au centre) :**

```json
{
  "type": "don",
  "carte_obtenue": {
    "id": 6,
    "titre": "Carte de Juin",
    "categorie": "mois_don",
    "mois_numero": 6,
    "image_url": "...",
    "deja_possedee": false
  },
  "badges_debloques": [
    {
      "id": 2,
      "nom": "Donneur Confirmé",
      "image_url": "https://cdn.bloodshare.nc/badges/2.webp"
    }
  ]
}
```

**Réponse 200 — succès (événement) :**

```json
{
  "type": "evenement",
  "evenement": { "id": 5, "titre": "Collecte mobile Nouméa" },
  "carte_obtenue": {
    "id": 13,
    "titre": "Carte Événement",
    "categorie": "evenement",
    "image_url": "...",
    "quantite": 2
  },
  "badges_debloques": []
}
```

> `quantite` indique le nombre total d'exemplaires de cette carte après ce scan (la carte "Événement" est générique en V1, donc cumulable).
**Réponse 422 — don refusé (délai non respecté) :**

```json
{
  "message": "Vous n'êtes pas encore éligible pour donner.",
  "prochaine_eligibilite": "2026-07-15"
}
```

**Réponse 404 — token invalide :**

```json
{ "message": "QR Code invalide ou expiré." }
```

# 4\. Dons
## `GET /dons`
Liste les dons déjà validés par l'utilisateur — alimente l'écran "Historique des dons" du profil. _Authentifié._ Historique des dons de l'utilisateur connecté.
**Réponse 200 :**

```json
{
  "data": [
    {
      "id": 8,
      "date_don": "2026-05-10T09:00:00Z",
      "type": "centre",
      "carte_obtenue": { "id": 6, "titre": "Carte de Mai", "categorie": "mois_don" }
    }
  ],
  "total_dons": 5
}
```

# 5\. Cartes
## `GET /cartes`
Alimente l'onglet Cartes — renvoie la collection organisée par catégorie (mois du don / événement / parrainage), en indiquant lesquelles l'utilisateur possède déjà (les autres s'affichent grisées dans l'UI). _Authentifié._
**Réponse 200 :**

```json
{
  "mois_don": {
    "pourcentage_complete": 41.7,
    "cartes": [
      { "id": 1, "titre": "Carte de Janvier", "mois_numero": 1, "image_url": "...", "obtenue": false },
      { "id": 6, "titre": "Carte de Juin", "mois_numero": 6, "image_url": "...", "obtenue": true }
    ]
  },
  "evenement": {
    "carte": { "id": 13, "titre": "Carte Événement", "image_url": "...", "obtenue": true, "quantite": 3 }
  },
  "parrainage": {
    "carte_parrain": { "id": 14, "titre": "Carte Parrain", "image_url": "...", "obtenue": true, "quantite": 1 },
    "carte_filleul": { "id": 15, "titre": "Carte Filleul", "image_url": "...", "obtenue": false }
  }
}
```

> Pas de notion de rareté — toutes les cartes sont équivalentes, seule la catégorie les distingue. Le `pourcentage_complete` ne s'applique qu'à la collection "Mois du don" (12 cartes), qui est la seule pensée comme une vraie collection à compléter.
# 6\. Badges
## `GET /badges`
Alimente la section Badges du profil — liste tous les badges existants, obtenus ou non. _Authentifié._
**Réponse 200 :**

```json
[
  {
    "id": 1,
    "nom": "Premier Pas",
    "image_url": "...",
    "obtenu": true,
    "obtenu_at": "2026-02-01T10:00:00Z"
  },
  {
    "id": 3,
    "nom": "Quiz Master",
    "image_url": "...",
    "obtenu": false
  }
]
```

# 7\. Points
## `GET /points/historique`
Renvoie le détail de chaque gain de points (utile si vous voulez afficher un historique ou un graphique de progression). _Authentifié._
**Réponse 200 :**

```json
{
  "points_cumules": 280,
  "historique": [
    { "points": 30, "source": "quiz", "created_at": "2026-05-08T14:00:00Z" },
    { "points": 75, "source": "parrainage", "created_at": "2026-05-10T09:01:00Z" },
    { "points": 50, "source": "defi", "created_at": "2026-05-31T23:59:00Z" }
  ]
}
```

> Les sources possibles sont uniquement `quiz`, `defi`, `parrainage` — un don ou un événement ne génère jamais d'entrée ici (voir section 3 sur `/scan`).
# 8\. Quiz
## `GET /quiz`
Alimente l'écran d'accueil de l'onglet Quiz — la liste de tous les quiz disponibles, déjà triés par catégorie. _Authentifié._ Liste groupée par catégorie.
**Réponse 200 :**

```json
[
  {
    "categorie": "Les bases du don",
    "quiz": [
      { "id": 1, "titre": "Qui peut donner ?", "points_attribues": 30, "complete": true },
      { "id": 2, "titre": "Comment se préparer ?", "points_attribues": 30, "complete": false }
    ]
  }
]
```

## `GET /quiz/{id}`
Récupère le contenu d'un quiz précis (ses questions et réponses possibles) — à appeler quand l'utilisateur clique sur un quiz pour le lancer. _Authentifié._
**Réponse 200 :**

```json
{
  "id": 1,
  "titre": "Qui peut donner ?",
  "aleatoire": false,
  "questions": [
    {
      "id": 1,
      "intitule": "Quel âge minimum pour donner son sang ?",
      "type": "unique",
      "reponses": [
        { "id": 1, "texte": "16 ans" },
        { "id": 2, "texte": "18 ans" },
        { "id": 3, "texte": "21 ans" }
      ]
    }
  ]
}
```

> Le champ `est_correcte` n'est jamais renvoyé avant soumission.
## `POST /quiz/{id}/soumettre`
Envoie les réponses choisies par l'utilisateur une fois le quiz terminé, et reçoit en retour le score et les points gagnés. _Authentifié._
**Requête :**

```json
{
  "reponses": [
    { "question_id": 1, "reponse_ids": [2] }
  ]
}
```

**Réponse 200 :**

```json
{
  "score": 4,
  "total_questions": 5,
  "points_gagnes": 30,
  "premiere_completion": true
}
```

> Si `premiere_completion` est `false`, `points_gagnes` sera `0` (quiz rejoué).
# 9\. Défi du mois
## `GET /defis/actuel`
Alimente le bloc "Défi du mois" affiché sur l'écran d'accueil, avec sa progression en temps réel. _Authentifié._
**Réponse 200 :**

```json
{
  "id": 3,
  "titre": "100 dons ce mois !",
  "description": "Aidons le centre à atteindre son objectif.",
  "objectif_chiffre": 100,
  "progression_actuelle": 67,
  "points_attribues": 50,
  "date_fin": "2026-06-30"
}
```

> Retourne `null` si aucun défi actif.
# 10\. Contenu
## `GET /actualites`
Alimente le carousel d'actualités sur l'écran d'accueil. **Réponse 200 :**

```scheme
[
  { "id": 1, "titre": "Journée mondiale du don", "image_url": "...", "published_at": "2026-06-01" }
]
```

## `GET /fiches-infos`
Alimente les fiches pratiques sur le don, affichées dans l'onglet Don. **Réponse 200 :** même structure que `/actualites`, avec un champ `categorie` en plus.
## `GET /faq`
Alimente la section FAQ / Informations pratiques. **Réponse 200 :**

```scheme
[
  { "id": 1, "categorie": "Éligibilité", "question": "Qui peut donner ?", "reponse": "..." }
]
```

## `GET /stock-sang`
Alimente l'animation du stock de sang par groupe sanguin sur l'écran d'accueil. **Réponse 200 :**

```scheme
[
  { "groupe_sanguin": "O-", "niveau": "critique" },
  { "groupe_sanguin": "A+", "niveau": "bon" }
]
```

## `GET /evenements`
Liste les événements à venir organisés par l'association, affichés sur l'accueil. **Réponse 200 :**

```scheme
[
  {
    "id": 5,
    "titre": "Collecte mobile Nouméa",
    "date_heure": "2026-07-02T09:00:00Z",
    "lieu": "Place des Cocotiers"
  }
]
```

# `GET /bannieres`
Vérifie s'il y a une alerte pénurie à afficher en bandeau sur l'écran d'accueil. **Réponse 200 :**

```json
{
  "active": true,
  "type": "urgence",
  "titre": "Pénurie O−",
  "message": "Le stock de O− est critique, donnez vite !"
}
```

> Retourne `{ "active": false }` si aucune bannière active.
# 11\. Parrainage
## `GET /parrainage/code`
Récupère le code de parrainage personnel de l'utilisateur, à afficher/partager depuis l'écran Profil. _Authentifié._
**Réponse 200 :**

```css
{ "code": "XYZ98765", "nb_parrainages_valides": 2 }
```

## `POST /parrainage/valider`
_Appelé automatiquement côté backend lors du premier don du filleul — pas un appel direct du mobile._
* * *
## Notes pour l'intégration mobile
*   Tous les timestamps sont au format **ISO 8601 UTC**.
*   Les images (`image_url`, `avatar_url`) sont pour l'instant des chemins vers des assets **locaux** embarqués dans le projet mobile (`assets/cartes/`, `assets/badges/`, `assets/avatars/`) plutôt que des URLs Cloudinary — plus simple pour démarrer, sans dépendance réseau. Le passage à Cloudinary se fera plus tard si besoin, sans changer la structure des réponses JSON (juste la valeur du champ qui passera d'un nom de fichier à une URL absolue).
*   Le token d'authentification n'expire pas côté Sanctum par défaut — prévoir un refresh ou une déconnexion automatique en cas de réponse `401`.
*   Tant que le backend n'est pas prêt sur un endpoint donné, mocker la réponse exactement selon ce format pour ne pas avoir à retoucher l'UI plus tard.