# Gamification

# Vue d'ensemble
Blood Share utilise un système de gamification pour sensibiliser et fidéliser les donneurs de sang. L'utilisateur accumule des **points**, obtient des **boosters**, collectionne des **cartes**, débloque des **badges**, participe au **défi du mois** et complète des **quiz**.
Les points s'accumulent uniquement — ils ne se dépensent pas. Ils servent de **score de fidélité** visible sur le profil.
# 1\. Points
## Principe
Les points s'accumulent tout au long de l'utilisation de l'appli. Ils reflètent l'engagement de l'utilisateur envers le don du sang.
## Sources de points

| Action | Points | Conditions |
| ---| ---| --- |
| Don effectué (QR Code centre) | 100 pts | 1 fois par don validé |
| Présence à un événement (QR Code event) | 50 pts | 1 fois par événement |
| Quiz complété | 30 pts | 1 fois par quiz (rejouable sans points) |
| Défi du mois complété | Variable | Défini par l'admin |
| Parrainage validé (parrain) | 75 pts | Par filleul qui fait son 1er don |
| Parrainage validé (filleul) | 50 pts | À la validation du parrainage |
| Doublon carte commune | 10 pts | Conversion automatique |
| Doublon carte rare | 25 pts | Conversion automatique |

## Règles importantes
*   Les points du **don** ne sont attribués qu'une fois le QR Code scanné et validé
*   Le **quiz** peut être rejoué mais les points ne sont donnés qu'à la première complétion — `points_attribues: true/false` dans `user_quiz`
*   Le **parrainage** est validé automatiquement quand le filleul effectue son premier don
*   Les **doublons** de cartes sont automatiquement convertis en points — jamais ajoutés en double dans la collection
## Traçabilité
Chaque gain de points est enregistré dans `points_historique` avec la source et la date.
# 2\. Boosters
## Principe
Un booster est un paquet de 3 cartes à collectionner obtenu après certaines actions. L'écran d'ouverture s'affiche automatiquement après le scan d'un QR Code — l'utilisateur ne peut pas reporter l'ouverture. Les boosters non ouverts ne sont pas visibles dans l'application.
## Obtention

| Action | Booster attribué |
| ---| --- |
| Don validé (scan QR Code centre) | ✓ 1 booster |
| Présence à un événement (scan QR Code event) | ✓ 1 booster |

## Composition d'un booster

```java
1 booster = 3 cartes
├── 2 cartes communes (tirées aléatoirement parmi les 8 communes)
└── 1 carte rare garantie (tirée aléatoirement parmi les 4 rares)
```

## Règles importantes
*   Le booster s'ouvre **immédiatement** après le scan — pas d'inventaire de boosters en attente
*   L'ouverture est irréversible
*   Les doublons sont convertis automatiquement en points (`source: "doublon"` dans `points_historique`)
*   Le tirage est géré côté backend Laravel au moment de l'ouverture
## Flux technique

```sql
User scanne le QR Code
        ↓
Validation du scan (points attribués)
        ↓
Écran d'ouverture de booster affiché automatiquement
        ↓
Animation d'ouverture
        ↓
3 cartes révélées (2 communes + 1 rare)
        ↓
Pour chaque carte tirée :
├── User ne possède pas encore cette carte
│   └── Ajout dans user_cartes
└── User possède déjà cette carte
    └── +points dans points_historique (source: "doublon")
        ├── Carte commune → +10 pts
        └── Carte rare    → +25 pts
        ↓
Booster marqué ouvert en BDD (statut: ouvert, ouvert_at: now())
        ↓
Retour à l'écran précédent
```

# 3\. Cartes
## Principe
12 cartes à collectionner réparties en 2 raretés. L'utilisateur les obtient uniquement en ouvrant des boosters.
## Catalogue (V1)

| Rareté | Nombre | Rôle dans le booster |
| ---| ---| --- |
| Commune | 8 cartes | 2 tirées aléatoirement |
| Rare | 4 cartes | 1 garantie par booster |

## Thématique suggérée
Les cartes représentent des figures ou moments liés au don du sang :
_Illustrations à définir !_

```scss
Communes (8)
├── Le Premier Don
├── Le Donneur Régulier
├── Le Groupe O-
├── Le Don de Plaquettes
├── Le Don de Plasma
├── La Journée Mondiale
├── Le Bénévole
└── Le Centre CNT

Rares (4)
├── Le Donneur Universel
├── Le Héros Silencieux
├── Le Sang Rare
└── Le Champion du Don
```

## Doublons
Lorsqu'un utilisateur reçoit un exemplaire d'une carte qu'il possède déjà, la carte est automatiquement convertie en points :

```plain
Doublon commun → +10 pts
Doublon rare   → +25 pts
```

## Affichage
*   Onglet **Cartes** de l'appli mobile
*   Collection complète visible (cartes non obtenues affichées en grisé)
*   Pourcentage de collection complétée affiché
# 4\. Badges
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
# 5\. Défi du mois
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
├── Récompense : points bonus pour chaque participant
│   + badge spécial si objectif atteint
└── Visible sur l'écran Accueil
```

## Règles
*   Un seul défi actif à la fois
*   Participation **automatique** dès qu'un don est validé pendant la période du défi
*   Si l'objectif est atteint → tous les participants reçoivent les points attribués + badge spécial
*   Le défi est renouvelé chaque mois par l'admin depuis le backoffice
*   La progression est mise à jour en temps réel dans `user_defis.progression`
# 6\. Quiz
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

Catégorie 3 — L'association ACDO-NC
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

# 7\. Parrainage
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
Filleul reçoit 50 pts + badge "Filleul"
Les deux reçoivent une notification
```

## Règles
*   Un utilisateur peut parrainer plusieurs personnes
*   Un filleul ne peut être parrainé qu'une seule fois
*   La validation se déclenche au 1er don du filleul — pas à l'inscription
*   Le code de parrainage est unique, généré automatiquement à l'inscription
*   L'anonymat est préservé — le parrain voit uniquement "1 parrainage validé", pas l'identité du filleul
# 8\. Récapitulatif — Déclencheurs et récompenses

```scss
Action utilisateur           Points    Booster   Badge possible
──────────────────────────────────────────────────────────────
Don validé (QR Code centre)  +100      ✓         Premier Pas, Donneur Confirmé...
Événement (QR Code event)    +50       ✓         —
Quiz complété (1ère fois)    +30       ✗         Quiz Master
Défi du mois complété        Variable  ✗         Défi du mois
Parrainage validé (parrain)  +75       ✗         Ambassadeur
Parrainage validé (filleul)  +50       ✗         Filleul
Doublon carte commune        +10       ✗         —
Doublon carte rare           +25       ✗         —
```

# 9\. Ce qui est géré dans le code (hors backoffice)

```bash
→ Algorithme de tirage des cartes dans un booster
→ Conversion automatique des doublons en points
→ Vérification automatique des conditions de badges
→ Mise à jour de la progression du défi du mois
→ Règle quota dons (6 dons/an homme, 4 dons/an femme, délai 8 semaines)
→ Génération du code de parrainage à l'inscription
→ Séries de quiz initiales (seeders)
→ Probabilités de tirage (commun/rare)
→ Questionnaire d'éligibilité (fichier JSON, aucune persistance BDD)
```

# 10\. Ce qui est géré dans le backoffice

```java
→ Valeur des points par action (super_admin)
→ Création/modification du défi du mois (admin)
→ Création/modification des quiz (admin)
→ Création/modification des badges (admin)
→ Création/modification des cartes (admin)
→ Consultation des parrainages (admin)
```