---
description: Rédige le titre et la description d'une Pull Request selon les conventions BloodShare
argument-hint: [numéro US, ex: FO-02]
allowed-tools: Bash(git status:*), Bash(git log:*), Bash(git diff:*), Bash(git branch:*), Read
---

## Contexte

Branche courante :
!`git branch --show-current`

Commits de cette branche (non présents sur main) :
!`git log main..HEAD --oneline`

Fichiers modifiés :
!`git diff main...HEAD --stat`

Diff complet :
!`git diff main...HEAD`

US mentionnée par l'utilisateur : $ARGUMENTS

## Ta tâche

Génère une description de Merge Request selon le template ISI, à partir des changements de la branche courante.

### Titre

Format Conventional Commits, en français, à l'impératif :
`type(portée): description - US-xx`

- `type` : `feat` (nouvelle fonctionnalité ou évolution), `fix`, `refactor`, `test`, `docs`, `chore`, `style`
- `portée` (optionnel) : module touché — don, quiz, collection, badges, stocks, profil, auth, bdd, notifs, migrations...
- `US-xx` : identifiant ClickUp (ex: FO-02, BO-05). Omets ce suffixe si aucune US n'est identifiable.

Règle stricte : `refactor` ne change **jamais** le comportement. Si le comportement change, c'est `feat` ou `fix`.

### Description

Remplis le template BloodShare :
```md
## Description
<!-- Ex: [FO-02][Auth] - Connexion / Déconnexion + lien ClickUp -->

## Type
- [ ] **feat** — nouvelle fonctionnalité ou évolution
- [ ] **fix** — correction d'un bug
- [ ] **refactor** — sans changement de comportement
- [ ] **test** — ajout de tests sur de l'existant
- [ ] **docs / chore / style** — technique

## US liée
<!-- Lien Clickup -->

## Périmètre couvert
- [ ] L'US est entièrement couverte (toutes les sous-tâches)
- [ ] Couverture partielle — *préciser ce qui reste !*

## Ce qui change
<!-- Liste courte des modifications principales (fichiers, écrans, endpoints...) -->

## Comment tester 

## Points ouverts / à discuter
<!-- Questions pour le/la relecteur·rice, décisions à valider... -->
```


### Vérifications à signaler

Avant d'afficher le résultat, préviens l'utilisatrice si tu repères :

- un fichier de migration en doublon (même nom logique, timestamps différents)
- des données médicales ou d'identité réelle ajoutées au modèle de données (contrainte anonymat)
- du code qui attribue des points lors d'un don (règle éthique ADSB-NC : un don ne rapporte jamais de points)
- de la logique métier écrite directement dans un composant UI plutôt que dans la couche d'accès aux données (architecture adaptateur)
- des commits mélangeant plusieurs types de travail (une PR = un type cohérent)

Ces signalements vont **avant** le titre et la description, sous un titre `⚠️ À vérifier avant de publier`. S'il n'y a rien à signaler, n'affiche pas cette section.