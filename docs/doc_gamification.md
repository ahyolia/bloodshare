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
Chaque gain de points est enregistré dans `points_historique` avec la source et la date.
# 2\. Cartes
## Principe
Des cartes-souvenirs à collectionner, attribuées **directement** par une action précise : pas de tirage aléatoire, pas de booster, pas de rareté. Chaque carte appartient à une catégorie (colonne `categorie` de `cartes`), gérée dans le backoffice (titre, image, activation).
## Catégories

| Catégorie | Nombre | Obtention | Cumulable |
| ---| ---| ---| --- |
| `mois_don` — Carte du mois | 12 (une par mois) | Don validé au centre : carte du mois en cours | Non |
| `evenement` — Carte Événement | 1 (générique) | Présence validée à un événement (1 fois par événement) | Oui (`quantite`) |
| `parrain` — Carte Parrain | 1 | Premier parrainage validé | Non |
| `filleul` — Carte Filleul | 1 | Validation de son parrainage (son 1er don) | Non |

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
Carte du mois en cours :
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
*   Carte Événement avec son nombre d'exemplaires, cartes Parrain / Filleul
# 3\. Badges
## Principe
Les badges récompensent des jalons importants. Ils sont attribués automatiquement par le système quand la condition est remplie.
## Badges suggérés (V1)

| Badge | Condition | Type condition |
| ---| ---| --- |
| Premier Pas | 1er don effectué | action\_specifique |
| Donneur Confirmé | 3 dons effectués | nb\_dons: 3 |
| Fidèle au Don | 5 dons effectués | nb\_dons: 5 |
| Collectionneur | 6 cartes obtenues | action\_specifique |
| Ambassadeur | 1 parrainage validé | action\_specifique |
| Quiz Master | 5 quiz complétés | action\_specifique |
| Défi du mois | 1er défi du mois complété | action\_specifique |

## Attribution automatique

```bash
Après chaque action (don, scan, quiz, défi...)
        ↓
Laravel vérifie toutes les conditions de badges
        ↓
Si condition remplie et badge pas encore obtenu
        ↓
Entrée créée dans user_badges
Notification envoyée à l'utilisateur
```

## Affichage
*   Section **Badges** dans l'onglet Profil
*   Badge affiché en couleur si obtenu, grisé sinon
# 4\. Défi du mois
## Principe
Un objectif collectif renouvelé chaque mois — tous les utilisateurs contribuent ensemble. Visible sur l'écran d'accueil.
### Types d'objectifs communautaires

```bash
Volume        → "100 dons à Nouméa en mai"
Groupe sanguin → "50 dons O− ce mois"
Recrutement   → "30 nouveaux parrainages validés"
```

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
*   Un seul défi actif à la fois
*   Participation **automatique** dès qu'un don est validé pendant la période du défi
*   Si l'objectif est atteint → tous les participants reçoivent le badge « Objectif atteint », **sans points** (un don ne rapporte jamais de points)
*   Le défi est renouvelé chaque mois par l'admin depuis le backoffice
*   La progression est mise à jour en temps réel dans `user_defis.progression`
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
*   Points attribués **une seule fois** à la première complétion
*   Quiz **rejouable** après complétion sans gagner de points supplémentaires
*   Ordre des questions peut être aléatoire (`aleatoire: true/false`)
*   Types de questions : réponse unique ou réponses multiples
## Catégories prévues pour la V1 (codées via seeders)

```yaml
Catégorie 1 — Les bases du don
├── Quiz : Qui peut donner ?
├── Quiz : Comment se préparer ?
└── Quiz : Après le don

Catégorie 2 — Les groupes sanguins
├── Quiz : Connaître son groupe
├── Quiz : Compatibilités
└── Quiz : Groupes rares

Catégorie 3 — L'association ADSB-NC
├── Quiz : Rôle de l'association
├── Quiz : Le centre CNT
└── Quiz : Historique du don en NC
```

## Scoring

```yaml
Quiz complété pour la 1ère fois
        ↓
Score calculé (nb bonnes réponses / total)
Points attribués dans points_historique
user_quiz mis à jour (complete: true, points_attribues: true)
        ↓
Quiz rejoué
        ↓
Score calculé mais points_attribues: true → pas de nouveaux points
nb_tentatives incrémenté
```

# 6\. Parrainage
## Principe
Un utilisateur peut parrainer un proche pour l'encourager à donner son sang. Les deux parties sont récompensées.
## Flux

```rust
Parrain partage son code de parrainage
        ↓
Filleul s'inscrit avec le code
        ↓
Entrée créée dans parrainages (statut: en_attente)
        ↓
Filleul effectue son 1er don
        ↓
Parrainage validé automatiquement (statut: valide)
        ↓
Parrain reçoit 75 pts + badge "Ambassadeur"
Filleul reçoit la carte Filleul (pas de points : c'est son propre don)
Les deux reçoivent une notification
```

## Règles
*   Un utilisateur peut parrainer plusieurs personnes, sans plafond de points : chaque filleul validé rapporte +75 pts au parrain
*   La **carte Parrain** (et le badge Ambassadeur) ne sont donnés qu'**une seule fois**, au premier parrainage validé : les filleuls suivants n'ajoutent que des points
*   Un code de parrainage inconnu à l'inscription est refusé (erreur 422), il n'est jamais ignoré en silence
*   Un filleul ne peut être parrainé qu'une seule fois
*   La validation se déclenche au 1er don du filleul — pas à l'inscription
*   Le code de parrainage est unique, généré automatiquement à l'inscription
*   L'anonymat est préservé — le parrain voit uniquement "1 parrainage validé", pas l'identité du filleul

## Limites connues (à traiter dans de futures US)
*   **Notification** : le flux ci-dessus prévoit que les deux parties soient prévenues ; ce n'est pas encore implémenté (le parrain ne voit ses points qu'en rouvrant l'application). Prévu : notifications push (US à créer ; non testables dans Expo Go, il faut un build de développement).
*   **Risque d'abus (faux comptes filleuls)** : le QR Code du centre est un jeton **fixe**, sans preuve de présence physique, et l'inscription n'exige pas de vérification d'email. Quelqu'un disposant d'une photo du QR Code pourrait créer de faux comptes filleuls avec son propre code et cumuler +75 pts par faux compte. Non corrigé à ce stade ; le remède le plus efficace (QR Code du centre renouvelé régulièrement) change l'organisation au centre, à décider avec l'association.
*   **Badge « Filleul »** : la spec en prévoit un pour le filleul ; il n'existe pas parmi les badges actuels (le filleul reçoit la carte Filleul). À traiter avec l'US badges.
# 7\. Récapitulatif — Déclencheurs et récompenses

```scss
Action utilisateur           Points          Carte            Badge possible
─────────────────────────────────────────────────────────────────────────────
Don validé (QR Code centre)  —               Carte du mois    Premier Pas, Donneur Confirmé...
Événement (QR Code event)    —               Carte Événement  Toujours partant (3 cartes)
Quiz complété (1ère fois)    selon le quiz   —                Quiz Master
Défi du mois complété        —               —                Objectif atteint
Parrainage validé (parrain)  +75             Carte Parrain    Ambassadeur
Parrainage validé (filleul)  —               Carte Filleul    —
```

# 8\. Ce qui est géré dans le code (hors backoffice)

```bash
→ Attribution des cartes (carte du mois au don, carte Événement, cartes Parrain / Filleul)
→ Vérification automatique des conditions de badges
→ Mise à jour de la progression du défi du mois
→ Règle quota dons (6 dons/an homme, 4 dons/an femme, délai 8 semaines)
→ Génération du code de parrainage à l'inscription
→ Séries de quiz initiales (seeders)
→ Questionnaire d'éligibilité (fichier JSON, aucune persistance BDD)
```

# 9\. Ce qui est géré dans le backoffice

```java
→ Valeur des points par action (super_admin)
→ Création/modification du défi du mois (admin)
→ Création/modification des quiz (admin)
→ Création/modification des badges (admin)
→ Création/modification des cartes (admin)
→ Consultation des parrainages (admin)
```