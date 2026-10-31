# Analyse d'impact relative à la protection des données (AIPD) — Suivi des dons dans Aïma

> **Version** : 1.0 (brouillon) · **Date** : 14/10/2026 · **Statut** : à valider par le responsable du traitement
>
> **Responsable du traitement** : Association des Donneurs de Sang Bénévoles de Nouvelle-Calédonie (ADSB-NC)
> **Rédaction** : équipe de développement d'Aïma · **Référent RGPD** : [À COMPLÉTER — membre du bureau]
>
> Méthode : modèle de la CNIL (contexte, principes fondamentaux, risques, plan d'action).
> Les constats techniques ont été vérifiés dans le code le 14/10/2026.
> Documents liés : `docs/Dossier juridique prérempli — application AÏMA.docx.md`,
> `docs/Grille d'audit RGPD - Application mobile.md`, `docs/juridique/politique-confidentialite.md`.

## 0. Pourquoi une AIPD

Le traitement porte sur des **données de santé** (article 9 du RGPD) : le sexe associé aux dates de don révèle qu'une personne donne son sang, quand, et à partir de quand elle peut de nouveau donner.

Le traitement est de petite échelle et ce n'est pas l'activité principale de l'association. L'AIPD n'est donc peut-être pas strictement obligatoire. Elle est réalisée **par précaution**, parce que des données de santé sont en jeu, et parce qu'elle sert de référence pour les choix d'hébergement à venir.

## 1. Contexte

### 1.1 Le traitement

| | |
| --- | --- |
| **Finalité** | Suivre les dons de sang de l'utilisateur et le prévenir quand il peut de nouveau donner (8 semaines après un don pour un homme, 12 pour une femme) |
| **Ce que le traitement ne fait pas** | Un don ne rapporte jamais de points (règle éthique du don du sang). Aucune donnée n'est transmise au Centre de don du sang ni à un tiers |
| **Personnes concernées** | Utilisateurs majeurs de l'application (18 ans minimum, déclaratif) |
| **Base légale** | Consentement explicite (article 9.2.a du RGPD), recueilli par une case dédiée à l'inscription et vérifié par l'API |
| **Volume estimé** | [À COMPLÉTER — nombre d'utilisateurs attendus la première année] |

### 1.2 Les données

| Donnée | Source | Obligatoire | Utilisation |
| --- | --- | --- | --- |
| Sexe (homme / femme) | Saisi à l'inscription | Oui | Calcul du délai entre deux dons |
| Dates des dons validés | Scan du QR code remis au centre de don | Automatique | Historique des dons, date du prochain don possible, rappel |
| Preuve du consentement (dates, version des CGU) | Automatique | Oui | Preuve en cas de contrôle |

Ces données sont rattachées à un compte **pseudonyme** : pseudo et adresse email. L'application ne collecte ni nom, ni prénom, ni date de naissance, ni téléphone, ni adresse, ni groupe sanguin. Les réponses au questionnaire d'éligibilité restent sur l'appareil.

### 1.3 Cycle de vie des données

1. **Collecte** : à l'inscription (sexe, profil, consentement), puis à chaque scan du QR code d'un don.
2. **Utilisation** :
   - calcul quotidien de la date de fin du délai entre deux dons (commande `notifications:fin-ineligibilite`) ;
   - notification si l'utilisateur les a activées ;
   - affichage de l'historique dans l'application.
3. **Consultation** : par l'utilisateur dans l'application, et par les administrateurs habilités dans le backoffice. Le sexe n'est pas affiché dans le backoffice.
4. **Suppression** :
   - par l'utilisateur, à tout moment (*Profil > Paramètres > Supprimer mon compte*) ;
   - automatiquement après **3 ans sans connexion**.

   Dans les deux cas, le sexe est effacé, les tokens sont révoqués, et les dates de don restent uniquement rattachées à un compte anonymisé, pour les statistiques de l'association.

### 1.4 Supports

| Support | Rôle | Protection |
| --- | --- | --- |
| Application (PWA dans le navigateur) | Saisie, affichage | Jeton de connexion dans le `localStorage`, expiré après 90 jours. L'aperçu local du profil ne contient ni le sexe ni l'email |
| API Laravel | Traitement | HTTPS (à vérifier en production), contrôle d'accès par utilisateur, limitation des tentatives de connexion |
| Base PostgreSQL | Stockage | [À COMPLÉTER — chiffrement du disque, selon l'hébergeur] |
| Backoffice Filament | Administration | Comptes nominatifs, deux rôles, pas de double authentification (V2) |
| Hébergeur | Infrastructure | [À COMPLÉTER — nom, pays, certification HDS, contrat de sous-traitance] |
| Services de notification des navigateurs (Google, Mozilla, Apple) | Acheminement des rappels | Contenu chiffré de bout en bout (Web Push) |

## 2. Principes fondamentaux

| Principe | Évaluation | Mesures |
| --- | --- | --- |
| Finalité déterminée et légitime | ✅ | Une seule finalité, décrite dans la politique de confidentialité. Aucune réutilisation commerciale ni transmission à des tiers |
| Base légale | ✅ | Consentement explicite, distinct des CGU, avec date enregistrée. Point de vigilance : la case est obligatoire pour s'inscrire, justifiée parce que le suivi des dons est le cœur du service. En V2, on pourrait la rendre facultative |
| Minimisation | ✅ | Seulement le sexe (indispensable au calcul du délai) et les dates. Pas de profil de donneur (retiré en octobre 2026, il ne servait qu'à l'affichage). Pas de groupe sanguin, pas d'identité civile |
| Exactitude | 🟡 | Les dates viennent d'un scan de QR code, pas d'une saisie libre. Le sexe est déclaratif. Il n'est pas modifiable dans l'application : correction par email |
| Durée de conservation | ✅ | Vie du compte, puis suppression automatique après 3 ans d'inactivité. Historique anonymisé ensuite |
| Information | ✅ | Section « Vos données de santé » de la politique de confidentialité, accessible avant l'inscription |
| Droits | 🟡 | Suppression en libre-service et immédiate. Accès, rectification et portabilité : par email (aima.dondusang@outlook.fr), sans export dans l'application (V2) |
| Sous-traitants | ❌ | Contrat avec l'hébergeur à signer quand il sera choisi |
| Transferts hors UE | 🟡 | Les services de notification des navigateurs peuvent opérer aux États-Unis, mais ne reçoivent qu'un contenu chiffré. Le pays des serveurs reste à connaître |

## 3. Risques

Échelles de la CNIL : **négligeable**, **limitée**, **importante**, **maximale**.

**Ce que la fuite révélerait** : qu'une personne identifiée par son email donne son sang, et à quelles dates. L'impact est faible pour la plupart des personnes : le don du sang est un acte valorisé, et l'application ne contient aucune information sur les raisons d'une contre-indication. Il peut être plus sensible pour certaines personnes, par exemple si l'absence de dons ou leur arrêt est interprété par un proche ou un employeur.

### R1 — Accès illégitime aux données

| | |
| --- | --- |
| **Sources de risque** | Attaquant externe (faille de l'API, vol de jeton par XSS sur la PWA, accès au serveur) ; compte administrateur compromis ; appareil perdu ou partagé |
| **Menaces** | Lecture des dates de don et du sexe d'un ou plusieurs utilisateurs ; extraction de la base |
| **Mesures existantes** | Contrôle d'accès par utilisateur sur toutes les routes, testé ; mots de passe hachés (bcrypt) ; limitation des tentatives de connexion ; jetons expirés après 90 jours et révoqués à la suppression ; aucune donnée personnelle dans la console ; sexe absent du backoffice et du stockage local ; secrets hors du code |
| **Mesures prévues** | Chiffrement du disque et des sauvegardes chez l'hébergeur ; HTTPS et en-tête de sécurité CSP en production ; double authentification pour le backoffice (V2) ; traçabilité des actions des administrateurs (V2) |
| **Gravité** | **Limitée** |
| **Vraisemblance** | **Limitée**, à réévaluer une fois l'hébergement choisi |

### R2 — Modification non désirée des données

| | |
| --- | --- |
| **Sources de risque** | Utilisateur qui scanne le QR code du centre sans avoir donné, par exemple à partir d'une photo partagée : ce code était fixe jusqu'à l'US-29 (il change maintenant toutes les 30 secondes, une photo ne peut plus être relayée que pendant une minute au plus), et un scan apporte une carte, des badges, la validation du parrainage et une contribution au défi (mais jamais de points) ; administrateur qui modifie une donnée par erreur |
| **Menaces** | Dates de don fausses, donc un historique inexact et un rappel « vous pouvez redonner » envoyé au mauvais moment |
| **Mesures existantes** | Un seul scan de don par période d'éligibilité (8 ou 12 semaines), refusé sinon ; QR code du centre tournant, affiché sur un écran du centre et renouvelé toutes les 30 secondes : une photo ne sert qu'une minute au plus (audit cybersécurité, US-29) ; action « Régénérer le QR Code » dans le backoffice, qui désactive l'ancien code et le lien de l'écran ; le rappel est indicatif et l'entretien médical préalable au don reste obligatoire (rappelé dans les CGU et sur l'écran d'éligibilité) |
| **Mesures prévues** | Régénérer le code du centre à intervalles réguliers, et aussitôt s'il circule (procédure ADSB-NC, dès la V1) ; passer à un code à usage unique remis à chaque donneur (V2) |
| **Gravité** | **Négligeable** : l'entretien médical empêche un don trop rapproché, et la triche ne nuit qu'à l'exactitude du jeu |
| **Vraisemblance** | **Importante** : le code est fixe et facile à partager |

### R3 — Disparition des données

| | |
| --- | --- |
| **Sources de risque** | Panne ou erreur de manipulation sur le serveur, absence de sauvegarde, faille exploitée pour effacer la base |
| **Menaces** | Perte de l'historique des dons et des rappels |
| **Mesures existantes** | Suppression volontaire en transaction (pas d'état à moitié supprimé) |
| **Mesures prévues** | Sauvegardes régulières, chiffrées et testées chez l'hébergeur |
| **Gravité** | **Limitée** : l'utilisateur perd son historique et ses rappels, mais pas d'information indispensable, puisque le centre de don garde ses propres dossiers |
| **Vraisemblance** | **Importante** tant que les sauvegardes ne sont pas définies, **limitée** ensuite |

### Synthèse

| Risque | Gravité | Vraisemblance actuelle | Vraisemblance après les mesures prévues |
| --- | --- | --- | --- |
| R1 — Accès illégitime | Limitée | Limitée | Négligeable |
| R2 — Modification | Négligeable | Importante | Limitée (avec un code renouvelé ou à usage unique) |
| R3 — Disparition | Limitée | Importante | Limitée |

**Conclusion** : aucun risque n'a une gravité « importante » ou « maximale ». R2 est vraisemblable, mais sa gravité reste négligeable, puisqu'il ne nuit qu'à l'exactitude de l'historique et du jeu. Le traitement peut être mis en œuvre sous réserve du plan d'action ci-dessous, en particulier des points liés à l'hébergement. Aucune consultation préalable de la CNIL ne paraît nécessaire.

## 4. Plan d'action

| # | Mesure | Risque | Échéance | Responsable |
| --- | --- | --- | --- | --- |
| 1 | Vérifier si l'hébergement doit être certifié HDS, puis choisir l'hébergeur | R1, R3 | Avant la mise en ligne | Équipe + ADSB-NC |
| 2 | Signer un contrat de sous-traitance avec l'hébergeur (article 28 du RGPD) | R1 | Avant la mise en ligne | ADSB-NC |
| 3 | Chiffrement du disque, sauvegardes chiffrées et testées | R1, R3 | Avant la mise en ligne | Équipe |
| 4 | HTTPS et en-tête CSP en production ; variables `LOG_STACK=daily`, `LOG_DAILY_DAYS=180` ; service `scheduler` actif | R1 | Avant la mise en ligne | Équipe |
| 5 | Désigner un référent RGPD et écrire la procédure de réponse aux demandes et de gestion des violations de données | Tous | Avant la mise en ligne | ADSB-NC |
| 6 | Double authentification pour le backoffice | R1 | V2 | Équipe |
| 7 | Traçabilité des actions des administrateurs | R1, R2 | V2 | Équipe |
| 8 | Export des données par l'utilisateur ; modification du sexe dans l'application | Droits | V2 | Équipe |
| 9 | Consentement santé facultatif (application utilisable sans suivi des dons) | Base légale | V2 | Équipe |
| 10 | ✅ QR code de don du centre tournant (30 s), affiché sur un écran du centre. Régénérer le QR code dans le BO si le lien de l'écran a circulé | R2 | Fait (US-29) | Équipe |
| 11 | Passer à un QR code de don à usage unique par donneur | R2 | V2 | Équipe |

## 5. Validation

| | Nom | Date | Avis |
| --- | --- | --- | --- |
| Référent RGPD | [À COMPLÉTER] | | |
| Responsable du traitement (ADSB-NC) | [À COMPLÉTER] | | ☐ Validé ☐ Validé sous réserve ☐ Refusé |

L'AIPD est à réexaminer en cas de changement important : choix de l'hébergeur, nouvelle donnée de santé collectée, transmission au centre de don, forte hausse du nombre d'utilisateurs, ou violation de données.
