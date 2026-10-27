# Gamification

# Vue d'ensemble
Aïma utilise un système de gamification pour sensibiliser et fidéliser les donneurs de sang. L'utilisateur accumule des **points**, collectionne des **cartes**, débloque des **badges**, participe au **défi du mois** et complète des **quiz**.
Les points s'accumulent uniquement — ils ne se dépensent pas. Ils servent de **score de fidélité** visible sur le profil.
# 1\. Points
## Principe
Les points s'accumulent tout au long de l'utilisation de l'appli. Ils reflètent l'engagement de l'utilisateur envers le don du sang.
## Sources de points

| Action | Points | Conditions |
| ---| ---| --- |
| Quiz complété | Défini par quiz dans le BO, proportionnel au score | 1 fois par quiz (rejouable sans points) |
| Parrainage validé (parrain) | 75 pts | Par filleul qui fait son 1er don |

Ce sont les **deux seules** sources de points. Le don, la présence à un événement, le défi du mois et les cartes n'en rapportent pas.

## Règles importantes
*   **Un don ne rapporte jamais de points** (règle éthique ADSB-NC) : ni le don lui-même, ni ce qu'il déclenche pour le donneur (validation de son parrainage en tant que filleul, objectif d'un défi atteint). Le don est récompensé par des cartes et des badges uniquement.
*   Le **parrain** reste récompensé en points : il gagne pour avoir sensibilisé quelqu'un d'autre, pas pour son propre don
*   La **présence à un événement** ne rapporte pas de points non plus : un événement est souvent une collecte de sang, y donner des points reviendrait à récompenser le don (cf. `contrat_API.md`, `POST /scan`). Elle est récompensée par la carte Événement et le badge « Toujours partant »
*   Le **quiz** peut être rejoué mais les points ne sont donnés qu'à la première complétion — `points_attribues: true/false` dans `user_quiz`
*   Le **parrainage** est validé automatiquement quand le filleul effectue son premier don
*   Une carte déjà possédée ne rapporte **rien en échange** (ni points, ni autre carte) : voir § 2
## Traçabilité
Chaque gain de points est enregistré dans `points_historique` avec la source et la date, et cumulé dans `users.points_cumules`.
## Niveaux
Les points cumulés déterminent un niveau (`NiveauService`), affiché dans l'en-tête et sur le profil avec la progression vers le palier suivant :

| Niveau | Libellé | Points cumulés |
| ---| ---| --- |
| 1 | Curieux | 0 – 99 |
| 2 | Informé | 100 – 299 |
| 3 | Engagé | 300 – 599 |
| 4 | Ambassadeur | 600 – 999 |
| 5 | Héros | 1000 et plus |

Le passage à un niveau supérieur déclenche une notification « niveau atteint ».
# 2\. Cartes
## Principe
Des cartes-souvenirs à collectionner, attribuées **directement** par une action précise : pas de tirage aléatoire, pas de booster, pas de rareté. Chaque carte appartient à une catégorie (colonne `categorie` de `cartes`), gérée dans le backoffice (titre, image, activation).
## Catégories

| Catégorie | Nombre | Obtention | Cumulable |
| ---| ---| ---| --- |
| `mois_don` — Carte du mois | 12 (une par mois) | Don validé au centre : carte du mois en cours | Non |
| `evenement` — Carte Événement | 1 générique + 1 par événement qui a sa propre carte (ex. forum IUT) | Présence validée à un événement (1 fois par événement) : la carte choisie sur la fiche de l'événement, sinon la générique | Oui (`quantite`) |
| `parrain` — Carte Parrain | 1 | Premier parrainage validé | Non |
| `filleul` — Carte Filleul | 1 | Validation de son parrainage (son 1er don) | Non |
| `fidele` — Carte Fidèle | 1 | Premier don validé au moins **un an** après son tout premier don validé (ancienneté, pas nombre de dons : c'est le rôle du badge « Fidèle au Don ») — en plus de la carte du mois | Non |

## Carte déjà possédée
*   **Carte du mois** : si l'utilisateur la possède déjà (2e don dans le même mois de l'année, l'année suivante...), le don est bien validé mais aucune carte n'est redonnée. La réponse du scan l'indique (`deja_possedee: true`) et l'écran de résultat affiche « Carte déjà obtenue ». **Rien n'est donné en échange**, ni points ni autre carte.
*   **Carte Événement** : elle est cumulable, chaque nouvel événement incrémente `quantite` au lieu de créer une ligne en double.
*   **Cartes Parrain / Filleul** : données une seule fois ; les filleuls suivants n'ajoutent rien côté cartes.
*   Une contrainte unique `(user_id, carte_id)` sur `user_cartes` garantit qu'une même carte n'apparaît jamais deux fois dans la collection, même en cas de scans simultanés.
## Flux technique (don au centre)

```sql
User scanne le QR Code du centre
        ↓
Contrôle d'éligibilité (56 j homme / 84 j femme depuis le dernier don validé)
        ↓
Don enregistré (statut: valide) — aucun point
        ↓
Carte du mois en cours, dans la collection de l'année en cours :
├── pas encore possédée → ajout dans user_cartes
└── déjà possédée       → rien (deja_possedee: true)
        ↓
Parrainage validé si filleul, contribution au défi, synchronisation des badges
        ↓
Écran de résultat (carte obtenue + badges débloqués)
```

## Affichage
*   Onglet **Cartes** de l'appli mobile
*   Grille des 12 cartes du mois (non obtenues affichées en grisé) et pourcentage de complétion (sur 12)
*   Cartes Événement (générique et propres à un événement) avec leur nombre d'exemplaires, cartes Parrain / Filleul

## Collections par année
*   Les cartes du mois forment **une collection par année** (`cartes.annee`, une seule carte par mois et par année) : la carte de novembre 2027 est une autre carte que celle de novembre 2026, avec son propre dessin. La collection 2026 est la première.
*   Le scan donne la carte du mois **de l'année en cours** : un donneur qui a novembre 2026 obtient novembre 2027 l'année suivante.
*   La collection de l'année suivante est créée le 1er décembre (`cartes:creer-collection`, planifiée ; se lance aussi à la main avec une année), sans visuel : le BO a décembre pour y poser les dessins. Si elle manque au moment d'un scan, elle est créée à ce moment-là, le don n'est jamais bloqué.
*   Page Cartes : un bloc par collection (l'année en cours, marquée « En cours », puis les années passées où le donneur a au moins une carte), avec ses dernières cartes en éventail et sa progression sur 12. Toucher un bloc ouvre la collection en entier (`tabs/cartes/collection/[annee]`). Une collection future reste cachée.
*   Avec 56 à 84 jours entre deux dons, une collection d'une année ne peut pas être complète (6 cartes au plus). Les badges de cartes du mois comptent donc les **mois différents, toutes années confondues**.

## Carte propre à un événement
*   Dans le BO, la fiche d'un événement a un champ « Carte remise aux participants » (`evenements.carte_id`). Vide : l'événement remet la carte générique.
*   La carte générique est marquée explicitement (`cartes.generique`). Une carte Événement non générique n'est remise **que** par l'événement qui la désigne — jamais à sa place, même tant qu'elle n'est rattachée à aucun événement.
*   Une carte désignée mais désactivée : l'événement retombe sur la carte générique.
*   Le badge « Toujours partant » compte toutes les cartes Événement confondues.

## Visuels par défaut
*   Versionnés dans `bloodshare-backend/database/visuels/` (WebP : cartes 900 px de large, badges 512 px), posés par `VisuelsSeeder` (lancé par les migrations `seed_visuels_cartes_et_badges` et `maj_visuels_cartes`, et par `DatabaseSeeder`).
*   Cartes illustrées (collection 2026) : janvier à mars, octobre à décembre, Parrain et Filleul (même visuel), Forum IUT, Fidèle. Les autres mois et la carte Événement générique gardent le placeholder.
*   Seules les `image_url` vides ou encore sur un visuel par défaut (`visuels/…`) sont remplies : une image envoyée depuis le BO n'est jamais écrasée.
*   Le fichier publié porte l'empreinte de son contenu (`mois-11-ed8b2457.webp`) : un visuel redessiné change d'URL, le cache de la PWA ne garde pas l'ancien. Pour remplacer un visuel, on remplace le WebP dans `database/visuels/` et on ajoute une migration qui relance `VisuelsSeeder`.
# 3\. Badges
## Principe
Les badges récompensent des jalons importants. Ils sont attribués automatiquement par le système quand la condition est remplie, une seule fois chacun, et ne rapportent pas de points.
## Badges en place (V1)
Créés par `BadgeSeeder` (et les migrations `seed_cartes_et_quiz_badges` / `seed_defis_badges` pour les environnements sans seeder). Un badge a une condition de l'un de deux types : `nb_dons` (seuil de dons validés, `condition_valeur`) ou `action_specifique` (identifiant technique, `action_specifique`).

| Thème | Badge | Condition | Type condition |
| ---| ---| ---| --- |
| Don | Premier Pas | 1er don validé | action\_specifique : `premier_don` |
| Don | Donneur Confirmé | 3 dons validés | nb\_dons : 3 |
| Don | Fidèle au Don | 5 dons validés | nb\_dons : 5 |
| Don | Compagnon de route | 10 dons validés | nb\_dons : 10 |
| Quiz | Grain de curiosité | 1er quiz complété | action\_specifique : `premier_quiz` |
| Quiz | Quiz Master | 5 quiz complétés | action\_specifique : `cinq_quiz` |
| Quiz | Incollable | Tous les quiz actifs complétés | action\_specifique : `toutes_categories_quiz` |
| Parrainage | Ambassadeur | 1er parrainage validé (parrain) | action\_specifique : `premier_parrainage` |
| Parrainage | Bien entouré | 3 parrainages validés (parrain) | action\_specifique : `trois_parrainages` |
| Parrainage | Bien accueilli | Inscription avec un code de parrainage (filleul) | action\_specifique : `inscrit_avec_code` |
| Cartes | Belle collection | Cartes du mois de 6 mois différents, toutes années confondues | action\_specifique : `six_cartes_mois` |
| Cartes | Année complète | Une carte de chacun des 12 mois, toutes années confondues | action\_specifique : `douze_cartes_mois` |
| Cartes | Toujours partant | 3 cartes Événement (3 événements) | action\_specifique : `trois_cartes_evenement` |
| Défi | Esprit d'équipe | Avoir contribué à un défi (au moins 1 don compté) | action\_specifique : `defi_contribue` |
| Défi | Objectif atteint | Avoir contribué à un défi dont l'objectif a été atteint | action\_specifique : `defi_remporte` |

Les quiz comptés sont uniquement ceux encore **actifs** : un quiz complété puis désactivé ne compte plus. Un badge désactivé dans le BO n'est plus attribué. Le BO permet de créer d'autres badges, en choisissant le type de condition et, pour `action_specifique`, une action dans la liste ci-dessus.

## Attribution automatique
`BadgeService::synchroniser()` recalcule l'état réel de l'utilisateur (dons validés, quiz complétés, parrainages, cartes, défis) et attribue **tout** badge éligible pas encore obtenu, quelle que soit l'action qui l'a rendu éligible.

```bash
Scan validé (don ou événement) / quiz soumis / inscription avec un code /
parrainage validé (côté parrain) / consultation de GET /badges
        ↓
BadgeService::synchroniser() vérifie toutes les conditions
        ↓
Si condition remplie et badge pas encore obtenu
        ↓
Entrée créée dans user_badges (contrainte unique : jamais en double)
Notification « badge débloqué » envoyée après validation de l'action
```

L'appel lors de la consultation de `GET /badges` sert de **rattrapage** : un don saisi autrement qu'au scan (BO, import) ou une condition remplie avant l'ajout d'un badge donne quand même le badge à la prochaine ouverture de l'écran.

## Affichage
*   Section **Badges** dans l'onglet Profil
*   Badge affiché en couleur si obtenu, grisé sinon
# 4\. Défi du mois
## Principe
Un objectif collectif renouvelé chaque mois — tous les utilisateurs contribuent ensemble. Visible sur l'écran d'accueil.
### Type d'objectif
Un seul type est géré : un **nombre de dons validés dans le mois**, tous donneurs confondus (`objectif_chiffre`). Les défis par groupe sanguin ou par nombre de parrainages ne sont pas implémentés (le groupe sanguin n'est d'ailleurs jamais stocké, contrainte d'anonymat).

#### Exemple

```powershell
"Ce mois-ci, atteignons 100 dons collectifs !"
├── Objectif : 100 dons
├── Progression : X / 100 (temps réel)
├── Récompense : badge « Objectif atteint » si objectif atteint
│   (pas de points : les participants sont des donneurs)
└── Visible sur l'écran Accueil
```

## Règles
*   Un seul défi actif à la fois : le backend prend le défi au statut `actif` (statuts possibles : `brouillon`, `actif`, `termine`)
*   Participation **automatique** dès qu'un don est validé pendant que le défi est actif
*   **Progression collective** (`progression_actuelle`) : nombre de dons validés du mois en cours, tous utilisateurs confondus
*   **Progression personnelle** (`ma_progression`) : nombre de dons de l'utilisateur comptés pour ce défi, dans `user_defis.progression`
*   Quand la progression collective atteint `objectif_chiffre`, le défi passe à `termine` et chaque contributeur est marqué `complete` : badges « Esprit d'équipe » (dès la 1re contribution) et « Objectif atteint », **sans points** (un don ne rapporte jamais de points)
*   Un défi terminé reste affiché sur l'accueil pour montrer le résultat, jusqu'à ce qu'un nouveau défi soit activé
*   Le défi est créé et activé chaque mois par l'admin depuis le backoffice (titre, description, objectif, date de fin)
## Notifications
*   Activation d'un défi → notification « nouveau défi » à tous les utilisateurs
*   Chaque lundi → notification de progression aux contributeurs du défi en cours
*   Objectif atteint → notification « défi réussi » aux contributeurs
# 5\. Quiz
## Principe
Séries de quiz de culture générale sur le don du sang. Disponibles dans l'onglet **Quiz** de l'appli.
## Structure

```powershell
Catégorie (ex: "Les bases du don")
└── Quiz 1 : Qui peut donner ?
    ├── Question 1 (réponse unique)
    ├── Question 2 (réponses multiples)
    └── Question 3 (réponse unique)
```

## Règles
*   Points attribués **une seule fois**, à la première complétion, **proportionnellement au score** : `points du quiz × bonnes réponses / nombre de questions`, arrondi à l'entier (ex. 4/5 sur un quiz à 30 pts → 24 pts). Un score de 0 ne rapporte rien
*   Quiz **rejouable** après complétion sans gagner de points supplémentaires (le score de la 1re complétion est conservé)
*   Une question à réponses multiples n'est juste que si **toutes** les bonnes réponses sont cochées et aucune mauvaise
*   Ordre des questions aléatoire ou fixe selon le quiz (`aleatoire: true/false`)
*   Les bonnes réponses ne sont **jamais envoyées** à l'application : la correction se fait côté serveur à la soumission
*   **Reprise** : les réponses données sont enregistrées au fil de l'eau (`user_quiz.progression`) ; un quiz commencé apparaît dans « Quiz en cours » et reprend là où l'utilisateur s'était arrêté
## Catégories
Trois catégories, figées dans le formulaire du backoffice pour garantir un regroupement propre côté mobile :

```yaml
Les bases du don
Les groupes sanguins
L'association ADSB-NC
```

Les quiz eux-mêmes (questions, réponses, points, statut) sont créés dans le backoffice. En local, `DemoSeeder` en crée trois d'exemple.
## Scoring

```yaml
Quiz soumis pour la 1ère fois
        ↓
Correction côté serveur : score = nombre de bonnes réponses
Points = points du quiz × score / total (arrondi), s'ils sont > 0 → points_historique
user_quiz mis à jour (complete: true, points_attribues: true, progression effacée)
Badges de quiz vérifiés
        ↓
Quiz rejoué
        ↓
Score calculé et renvoyé, mais aucun nouveau point
nb_tentatives incrémenté
```
## Notifications
*   Quiz du jour, chaque matin
*   Rappel unique, 3 jours après un quiz commencé et toujours pas terminé
*   Quiz activé dans le backoffice → notification « nouveau quiz » à tous les utilisateurs

# 6\. Parrainage
## Principe
Un utilisateur peut parrainer un proche pour l'encourager à donner son sang. Les deux parties sont récompensées : le parrain en points, carte et badges, le filleul en carte et badge uniquement (il est validé par son propre don, qui ne rapporte jamais de points).
## Flux

```rust
Parrain partage son code de parrainage
        ↓
Filleul s'inscrit avec le code
        ↓
Entrée créée dans parrainages (statut: en_attente)
Filleul reçoit le badge "Bien accueilli" (dès l'inscription, sans attendre de don)
Parrain notifié : « votre code de parrainage a été utilisé »
        ↓
Filleul effectue son 1er don
        ↓
Parrainage validé automatiquement (statut: valide)
        ↓
Parrain reçoit 75 pts + carte Parrain + badge "Ambassadeur" (1er filleul)
Parrain notifié : « votre filleul a fait son premier don »
Filleul reçoit la carte Filleul (pas de points : c'est son propre don)
```

## Règles
*   Un utilisateur peut parrainer plusieurs personnes, sans plafond de points : chaque filleul validé rapporte +75 pts au parrain
*   La **carte Parrain** (et le badge Ambassadeur) ne sont donnés qu'**une seule fois**, au premier parrainage validé : les filleuls suivants n'ajoutent que des points (et le badge « Bien entouré » au 3e)
*   Un code de parrainage inconnu à l'inscription est refusé (erreur 422), il n'est jamais ignoré en silence
*   Un filleul ne peut être parrainé qu'une seule fois
*   La validation se déclenche au 1er don du filleul — pas à l'inscription
*   Le code de parrainage est unique (8 caractères), généré automatiquement à l'inscription — ou à la première lecture pour un compte qui n'en avait pas ; il est accepté en minuscules à la saisie
*   L'anonymat est préservé — le parrain voit uniquement "1 parrainage validé", pas l'identité du filleul

## Limites connues (à traiter dans de futures US)
*   **Notification du filleul** : seul le parrain est notifié ; le filleul ne reçoit pas de notification à la validation de son parrainage (il voit sa carte Filleul sur l'écran de résultat du scan).
*   **Risque d'abus (faux comptes filleuls)** : le QR Code du centre est un jeton **fixe**, sans preuve de présence physique, et l'inscription n'exige pas de vérification d'email. Quelqu'un disposant d'une photo du QR Code pourrait créer de faux comptes filleuls avec son propre code et cumuler +75 pts par faux compte. Le backoffice permet de **régénérer** le QR Code centre (page « QR Code centre »), ce qui invalide l'ancien, mais rien ne le fait automatiquement : la fréquence de renouvellement est à décider avec l'association.
# 7\. Récapitulatif — Déclencheurs et récompenses

```scss
Action utilisateur           Points          Carte            Badges possibles
─────────────────────────────────────────────────────────────────────────────────────────────
Don validé (QR Code centre)  —               Carte du mois    Premier Pas, Donneur Confirmé, Fidèle au Don,
                                                              Compagnon de route, Belle collection, Année complète,
                                                              Esprit d'équipe
Événement (QR Code event)    —               Carte Événement  Toujours partant
Quiz complété (1ère fois)    selon le quiz   —                Grain de curiosité, Quiz Master, Incollable
Défi du mois remporté        —               —                Objectif atteint
Inscription avec un code     —               —                Bien accueilli
Parrainage validé (parrain)  +75             Carte Parrain    Ambassadeur, Bien entouré
Parrainage validé (filleul)  —               Carte Filleul    —
```

# 8\. Ce qui est géré dans le code (hors backoffice)

```bash
→ Attribution des cartes (carte du mois au don, carte Événement, cartes Parrain / Filleul)
→ Vérification automatique des conditions de badges
→ Mise à jour de la progression du défi du mois
→ Délai minimum entre deux dons validés : 56 jours (homme) / 84 jours (femme), vérifié au scan
  du QR Code centre (sinon 422 avec la date du prochain don possible). Pas de plafond annuel.
→ Génération du code de parrainage à l'inscription
→ Calcul des niveaux à partir des points cumulés
→ Correction des quiz et calcul des points proportionnels
→ Notifications planifiées (quiz du jour, rappels, fin d'inéligibilité, défi, carte du mois...)
→ Questionnaire d'éligibilité de l'appli : arbre de décision local
  (bloodshare-mobile/constants/eligibilite.ts), aucune réponse envoyée ni stockée (anonymat)
```

Les questions d'éligibilité existent aussi en base (`questions_eligibilite`), éditables dans le backoffice et exposées par `GET /eligibilite`, mais l'application ne les lit pas encore : c'est l'arbre local qui fait foi.

# 9\. Ce qui est géré dans le backoffice

```java
→ Création/modification/activation du défi du mois (admin)
→ Création/modification des quiz, dont les points de chaque quiz (admin)
→ Création/modification des badges (admin)
→ Création/modification des cartes : titre, image, activation (admin)
→ Création/modification des événements et de leur QR Code (admin)
→ Régénération et téléchargement du QR Code centre (admin)
→ Consultation et suppression des parrainages (admin)
→ Récapitulatif des points par action, en lecture seule (super_admin)
→ Questions d'éligibilité (super_admin)
```

Les valeurs fixes (75 pts du parrain, paliers de niveaux, délais d'éligibilité) sont dans le code, pas dans le backoffice.