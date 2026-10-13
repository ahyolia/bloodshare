# Textes juridiques d'Aïma — version 1.0 (brouillon)

Première version des trois documents affichés dans l'app, rédigée à partir du
dossier juridique (`docs/Dossier juridique prérempli — application AÏMA.docx.md`).

| Fichier | Type dans le BO |
|---|---|
| `cgu.md` | Conditions générales d'utilisation |
| `politique-confidentialite.md` | Politique de confidentialité |
| `mentions-legales.md` | Mentions légales |

## Avant publication

1. Faire relire et valider les textes par le bureau de l'ADSB-NC.
2. Remplacer chaque `[À COMPLÉTER : …]` (responsable de publication,
   hébergeur, propriété intellectuelle).
3. Copier le contenu de chaque fichier dans *Administration > Documents
   juridiques* (backoffice, super_admin), **sans** le titre : il est déjà
   affiché par l'app.

## Syntaxe

Les fichiers utilisent la syntaxe lue par l'app (`utils/documentTexte.ts`) :
`## ` pour un titre de section, `- ` pour une puce, une ligne vide entre deux
paragraphes. Rien d'autre n'est interprété (pas de gras ni de liens).

## Engagements à tenir côté code

Les textes annoncent des durées de conservation qui ne sont **pas encore
automatisées** :

- suppression des comptes sans connexion depuis 3 ans ;
- suppression de l'historique des notifications au bout d'un an ;
- journaux techniques limités à 6 mois (à configurer en production).

Ces points restent à implémenter avant la mise en ligne (US-28).
