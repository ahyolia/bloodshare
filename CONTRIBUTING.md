# Contributing — BloodShare

## Types de travail

| Type | Description | Préfixe commit |
|---|---|---|
| Fonctionnalité | Nouvelle fonctionnalité | `feat` |
| Évolution | Modification/complétion d'une fonctionnalité existante | `feat` |
| Fix | Correction d'un bug | `fix` |
| Test | Ajout de tests sur de l'existant | `test` |

Types techniques additionnels (commits uniquement) : `docs`, `chore`, `style`.

## Branches

Une branche par **US** (pas par sous-tâche), jamais de commit direct sur `main`.

Format : `type/description-courte-US-xx`

Exemples :
- `feat/validation-don-US-09`
- `fix/stocks-libelle-manquant-US-18`
- `refactor/bdd-schema-dons`

Règles :
- `type` = un des préfixes ci-dessus (`refactor` inclus, mais jamais de changement de comportement)
- `US-xx` = identifiant de la tâche ClickUp (ex: `FO-02`, `BO-05`)
- Description en minuscules, mots séparés par des tirets, sans accents

Les sous-tâches d'une US n'ont pas leur propre branche : elles deviennent des commits successifs dans la branche de l'US parente.

## Commits

Convention : [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

Format : `type(portée): description du commit sous forme d'un nom d'action`

Exemples :
- `feat(don): saisie et validation du code anonyme`
- `fix(stocks): ajout du label texte manquant sur le widget`
- `refactor(bdd): reorganisation du schéma des dons`
- `test(quiz): calcul d'XP de fin de parcours`
- `docs(contributing): ajout de la convention de branches`

Règles :
- `portée` (optionnel) : module touché — don, quiz, collection, badges, stocks, profil, auth, bdd, notifs...
- `refactor` ne change jamais le comportement. Si le comportement change → `feat` ou `fix`.

## Pull Requests

- Une PR par branche, ouverte vers `dev`
- Titre de PR = même idée que le commit : `feat(don): valider mon don - US09`
- Lier l'US ClickUp dans la description + résumer ce qui change (voir `.github/PULL_REQUEST_TEMPLATE.md`)
- Si la PR ne couvre qu'une partie des sous-tâches de l'US, le préciser clairement dans la description
- Relecture par l'autre dev avant merge (étape "En attente de review")
- La branche est supprimée après avoir été mergée

## Definition of Done

Avant de passer une tâche en "Terminé" :

- [ ] Tous les critères d'acceptation (checklist de la tâche) sont cochés
- [ ] Tests unitaires écrits et qui passent (`php artisan test` / `npm test`)
- [ ] Code relu via la PR
- [ ] `main` build toujours après merge

## Contraintes projet (à vérifier à chaque tâche)

- **Anonymat** : aucune donnée médicale ni d'identité réelle (nom, date de naissance, n° donneur, groupe sanguin de l'utilisateur) collectée ou stockée.
- **Accessibilité** : WCAG AA — couleur jamais seule, cibles ≥ 44–48 px.
- **Architecture adaptateur** : tout accès aux données passe par la couche découplée (mock JSON ↔ API), sans toucher au métier.
- Le don ne rapporte jamais de points (règle éthique ACDO-NC).