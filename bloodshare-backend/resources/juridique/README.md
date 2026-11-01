# Textes juridiques d'Aïma — version 1.0

Les trois documents affichés dans l'app, rédigés à partir du dossier juridique
(`docs/Dossier juridique prérempli — application AÏMA.docx.md`).

| Fichier | Type dans le BO |
|---|---|
| `cgu.md` | Conditions générales d'utilisation |
| `politique-confidentialite.md` | Politique de confidentialité |
| `mentions-legales.md` | Mentions légales |

Points **provisoires**, à mettre à jour le moment venu : l'hébergement (Netlify,
serveur de l'IUT, Neon à Sydney) et la propriété intellectuelle (équipe de
développement, en attendant un accord avec l'ADSB-NC).

## Publication

Les textes sont stockés en base (table `documents_juridiques`), pas lus dans ces
fichiers. `php artisan juridique:importer` les charge :

- **sans option**, elle ne remplit que les documents encore vides. Elle est lancée
  à chaque déploiement (`deploy/sae203/installer.sh`, `entrypoint.sh`) et ne touche
  jamais un texte modifié depuis le backoffice ;
- **`--force`** remplace aussi les documents déjà rédigés : à lancer après avoir
  modifié un fichier ici. Ajouter **`--numero=1.1`** pour changer la version
  affichée (la version des CGU est celle que les donneurs acceptent à
  l'inscription).

Les fichiers commencent directement par la première section, **sans** titre :
il est déjà affiché par l'app.

## Syntaxe

Les fichiers utilisent la syntaxe lue par l'app (`utils/documentTexte.ts`) :
`## ` pour un titre de section, `- ` pour une puce, une ligne vide entre deux
paragraphes, `**texte**` pour mettre en gras un élément important (durée,
interdiction, adresse de contact…). Rien d'autre n'est interprété (pas de liens).

## Engagements tenus côté code

Les durées de conservation annoncées sont automatisées (US-28) :

- suppression des comptes sans connexion depuis 3 ans (`donnees:purger-comptes-inactifs`) ;
- suppression de l'historique des notifications au bout d'un an (`donnees:purger-notifications`) ;
- journaux techniques limités à 6 mois (`config/logging.php`).

Changer une de ces durées dans le code impose de mettre à jour la politique de
confidentialité, et inversement.
