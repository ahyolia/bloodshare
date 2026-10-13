# Grille d'audit RGPD — Application Aïma

> Audit réalisé le 14/10/2026 sur la branche `dev` et les PR US-28 en relecture
> (consentements à l'inscription, documents juridiques, purge des données).
> Les statuts ont été vérifiés dans le code. Références : `docs/Dossier juridique prérempli — application AÏMA.docx.md`
> et `docs/juridique/` (CGU, politique de confidentialité, mentions légales).
>
> Légende : ✅ Oui · 🟡 Partiel · ❌ Non · 🔍 À vérifier au déploiement · ➖ Non applicable

## Synthèse et plan d'action

**À corriger avant la mise en ligne (V1)**

> ✅ Les points 1 à 4 sont corrigés dans la PR `fix/audit-rgpd-US-28` (à merger après les PR consentements et documents juridiques).

| # | Action | Pourquoi | Effort |
| --- | --- | --- | --- |
| 1 | ✅ Ne plus afficher l'erreur complète dans la console à la connexion et à l'inscription (`console.error` dans `login.tsx` et `register.tsx`) | L'objet d'erreur affiché contient la requête envoyée, donc l'email et le **mot de passe en clair**, visibles dans la console du navigateur en production | Faible |
| 2 | ✅ Mettre l'app en cohérence avec la politique sur les champs facultatifs : le profil de donneur et l'avatar sont annoncés facultatifs, mais l'inscription mobile les impose | Information inexacte des utilisateurs | Faible |
| 3 | ✅ Donner une durée de vie aux tokens de connexion (Sanctum `expiration`, aucune aujourd'hui) | Sur la PWA, le token est dans le `localStorage` et donne accès aux dates de don, qui sont des données de santé | Faible |
| 4 | ✅ Retirer le sexe de la fiche utilisateur du BO | Les admins n'en ont pas besoin, et il s'agit d'une donnée de santé | Faible |
| 5 | Choisir l'hébergeur : certification HDS, pays des serveurs, contrat de sous-traitance, chiffrement du disque et sauvegardes | Bloque les mentions légales, la politique et plusieurs critères ci-dessous | Fort |
| 6 | Configurer la production : HTTPS, `LOG_STACK=daily`, `LOG_DAILY_DAYS=180`, service `scheduler`, mots de passe différents de `.env.example` | Sans ça, les durées de conservation annoncées ne s'appliquent pas | Moyen |
| 7 | Réaliser l'analyse d'impact (AIPD) du suivi des dons | Obligatoire pour un traitement de données de santé | Moyen |
| 8 | Faire valider les textes par l'ADSB-NC et désigner un référent RGPD au bureau | Responsable du traitement | Hors code |

**À prévoir en V2**

- Export des données par l'utilisateur (droit d'accès et portabilité) : aujourd'hui, uniquement sur demande par email.
- Traçabilité des actions des admins (suspension, suppression, réinitialisation de mot de passe).
- Double authentification pour les comptes du backoffice.
- Consentement santé facultatif (app utilisable sans suivi des dons).
- Ré-acceptation des CGU quand leur version change.
- Prévenir l'utilisateur avant la suppression d'un compte inactif.

## 1. Gouvernance et responsabilité

| Critère | Statut | Constat / Action |
| --- | --- | --- |
| Responsable de traitement identifié | ✅ | L'ADSB-NC (RIDET 0 171 835.001), et non l'IUT. Indiqué dans la politique de confidentialité et les mentions légales. |
| DPO ou personne référente | 🟡 | DPO non obligatoire (petite échelle, pas l'activité principale de l'association). **Action** : désigner un référent RGPD au bureau. |
| Coordonnées de l'hébergeur | ❌ | Hébergeur pas encore choisi. Champs `[À COMPLÉTER]` dans les mentions légales et la politique. |
| Registre des activités de traitement | 🟡 | Le tableau « Traitements » du dossier juridique sert de base. **Action** : le reprendre dans un registre tenu par l'association. |
| Analyse d'impact (AIPD) | ❌ | Nécessaire : le suivi des dons traite des données de santé. **Action** : à réaliser (plan d'action n°7). |

## 2. Information et transparence

| Critère | Statut | Constat / Action |
| --- | --- | --- |
| Politique de confidentialité accessible depuis l'app | ✅ | Liens depuis l'inscription (avant création du compte) et depuis *Profil > Paramètres > À propos* (PR documents juridiques). Le texte reste à publier dans le BO après validation. |
| Finalités explicites | ✅ | Compte, suivi des dons et rappels, gamification, parrainage, notifications, support, sécurité. Il n'y a pas de prise de rendez-vous dans l'app, contrairement à ce que prévoyait l'ancienne grille. |
| Bases légales précisées | ✅ | Exécution des CGU (compte, gamification, parrainage), consentement explicite (données de santé), consentement (notifications), intérêt légitime (support, sécurité), obligation légale (demandes de droits). |
| Droits des personnes expliqués | ✅ | Section « Vos droits » : liste des droits, adresse de contact, délai d'un mois, réclamation CNIL. |
| Mentions légales | 🟡 | Rédigées. Restent : représentant légal, responsable de publication, hébergeur, propriété intellectuelle. |

## 3. Collecte et minimisation

| Critère | Statut | Constat / Action |
| --- | --- | --- |
| Seules les données nécessaires sont collectées | ✅ | Pseudo, email, mot de passe, sexe (pour le délai entre deux dons), profil de donneur. Pas de nom, de prénom, de date de naissance, de téléphone ni d'adresse. Le groupe sanguin a été supprimé, et les réponses au questionnaire d'éligibilité restent sur l'appareil. |
| Champs obligatoires et facultatifs distingués | ✅ | Corrigé : les étapes « profil de donneur » et « avatar » de l'inscription sont marquées facultatives et peuvent être passées. La finalité du profil de donneur a été corrigée dans la politique (affichage du profil et statistiques de l'association, et non « adapter les contenus », qui n'existait pas). Comme il révèle si l'on donne son sang, il est couvert par le consentement santé. |
| Cases de consentement non pré-cochées | ✅ | Les 4 cases de l'inscription (confidentialité, CGU, données de santé, 18 ans) sont décochées par défaut et vérifiées par l'API. |
| Minimisation dans le backoffice | ✅ | Corrigé : le sexe n'est plus affiché dans la fiche utilisateur du BO. |
| Données stockées sur le téléphone | ✅ | Liste blanche dans `auth.service.ts` : le profil enregistré localement ne contient ni le sexe ni l'email. |

## 4. Sécurité et confidentialité

| Critère | Statut | Constat / Action |
| --- | --- | --- |
| Communications en HTTPS | 🔍 | À vérifier sur Dokploy (Traefik). `trustProxies` est configuré pour générer des URL en HTTPS. |
| Mots de passe hachés | ✅ | Bcrypt (cast `hashed`, `BCRYPT_ROUNDS=12`). |
| Politique de mot de passe | ✅ | 8 caractères minimum avec majuscule, minuscule et chiffre (3 catégories), et un nombre de tentatives limité (connexion : 6/min, inscription : 15/min). Ça correspond au cas n°2 de la recommandation CNIL de 2022. La même règle s'applique au changement de mot de passe. |
| Contrôle d'accès côté serveur | ✅ | Toutes les routes personnelles filtrent sur `$request->user()` (dons, cartes, badges, points, quiz, notifications). Un test vérifie qu'elles exigent toutes d'être connecté (`DonneesPersonnellesTest`). |
| Stockage local sécurisé | 🟡 | En natif, le token est dans SecureStore (Keychain/Keystore). Sur la PWA, il est dans le `localStorage`, lisible en cas de faille XSS. Corrigé en partie : les tokens expirent maintenant après 90 jours (`config/sanctum.php`), et les tokens expirés sont purgés chaque nuit. Le stockage dans le `localStorage` reste un compromis propre à la PWA. **Action** : ajouter une politique de sécurité du contenu (en-tête CSP) au déploiement, pour limiter le risque XSS. |
| Pas de données personnelles dans les logs locaux | ✅ | Corrigé : `login.tsx` et `register.tsx` affichaient l'erreur axios complète, qui contenait l'email et le mot de passe en clair. Ils n'affichent plus que le code HTTP, et seulement en mode développement. |
| Journalisation des actions | 🟡 | Les erreurs sont journalisées (180 jours, PR purge). Les actions des admins sur les comptes (suspension, suppression, réinitialisation de mot de passe) ne sont pas tracées. **Action** : à prévoir en V2. |
| Accès d'administration | 🟡 | Comptes nominatifs, deux rôles (super_admin, admin), modification des textes sensibles réservée au super_admin. Pas de double authentification. **Action** : à prévoir en V2. |
| Secrets hors du code | ✅ | Seuls les `.env.example` sont versionnés, et les clés VAPID et `APP_KEY` y sont vides. **Action** : en production, ne pas reprendre les mots de passe de développement de `.env.example` (`DB_PASSWORD`, `SEED_ADMIN_PASSWORD`). |
| Sauvegardes chiffrées et testées | 🔍 | Dépend de l'hébergement (plan d'action n°5). |

## 5. Durée de conservation

| Critère | Statut | Constat / Action |
| --- | --- | --- |
| Durées définies | ✅ | Compte : durée de vie, puis suppression après 3 ans sans connexion. Notifications : 1 an. Support : 1 an. Journaux : 6 mois. Demandes de droits : traitement + 1 an. L'ancienne proposition « 5 ans après le dernier don » est abandonnée. |
| Durées mentionnées dans la politique | ✅ | Section « Combien de temps nous les gardons ». |
| Suppression automatique | 🟡 | Commandes `donnees:purger-comptes-inactifs` et `donnees:purger-notifications`, et journaux limités à 180 jours (PR purge en relecture). **Action** : configurer `LOG_STACK=daily` et le service `scheduler` en production. |
| Suppression ou anonymisation | ✅ | `User::anonymiser()` dans une transaction. Elle efface les données d'identité, le sexe, le profil, les rôles, les notifications et les abonnements push. L'historique de jeu est conservé sans lien avec la personne. Les comptes supprimés avant le correctif ont été rattrapés par une migration. |

## 6. Gestion des consentements

| Critère | Statut | Constat / Action |
| --- | --- | --- |
| Consentement avant l'envoi de notifications | ✅ | Notifications désactivées par défaut. L'autorisation est demandée par le navigateur quand l'utilisateur les active dans les paramètres. L'app n'envoie ni SMS ni email. |
| Retrait du consentement à tout moment | ✅ | Interrupteurs dans *Profil > Paramètres*, avec désabonnement côté serveur (`DELETE /notifications/subscription`). |
| Base légale de la gamification | ✅ | Exécution des CGU : c'est le cœur du service. L'ancienne grille parlait de « refuser la gamification sans perdre la prise de RDV », mais il n'y a pas de prise de RDV dans l'app. |
| Preuve du consentement | ✅ | Date et version des CGU acceptées, et date du consentement santé, enregistrées à l'inscription (PR consentements). |

## 7. Données de santé

| Critère | Statut | Constat / Action |
| --- | --- | --- |
| Données de santé identifiées | ✅ | Le sexe associé aux dates de don, et le profil de donneur s'il est renseigné. Le groupe sanguin n'est plus collecté. |
| Information explicite | ✅ | Section « Vos données de santé » de la politique de confidentialité. |
| Consentement explicite | ✅ | Case dédiée à l'inscription, vérifiée par l'API. Retrait par suppression du compte. Réservé aux personnes de 18 ans et plus. |
| Accès limité | ✅ | Seuls les admins du BO y ont accès, et le sexe ne leur est plus affiché. |
| Chiffrement au repos | ❌ | Aucun chiffrement des colonnes. Les dates de don servent dans des calculs SQL et ne peuvent pas être chiffrées colonne par colonne. **Action** : chiffrement du disque et des sauvegardes chez l'hébergeur. Le chiffrement de la colonne `sexe` (cast `encrypted`) est possible, à décider. |
| Hébergement certifié HDS | 🔍 | À vérifier avant de choisir l'hébergeur : l'obligation s'applique-t-elle à une app de sensibilisation, et en Nouvelle-Calédonie ? |
| Analyse d'impact | ❌ | Voir la section 1. |

## 8. Sous-traitance

| Critère | Statut | Constat / Action |
| --- | --- | --- |
| API externe (centre de don) | ➖ | Aucune API externe : les dons sont validés par scan de QR code. |
| Contrat avec l'hébergeur | ❌ | À signer quand l'hébergeur sera choisi. Clauses de sous-traitance (art. 28 RGPD). |
| Services de notification des navigateurs | ✅ | Mentionnés dans la politique (Google, Mozilla, Apple). Le contenu des notifications leur est transmis chiffré (Web Push). |
| Autres prestataires | ✅ | Aucun outil d'analyse, d'emailing ou de publicité. |

## 9. Droits des personnes

| Critère | Statut | Constat / Action |
| --- | --- | --- |
| Adresse dédiée | ✅ | aima.dondusang@outlook.fr (remplace `rgpd@blood-share.nc`). **Action** : remettre les identifiants de la boîte au bureau de l'ADSB-NC. |
| Délai d'un mois | 🟡 | Annoncé dans la politique. **Action** : écrire la procédure interne et nommer la personne qui traite les demandes. |
| Suppression | ✅ | Libre-service et immédiate (*Profil > Paramètres > Supprimer mon compte*). |
| Rectification | 🟡 | Pseudo et avatar modifiables dans l'app. Email et sexe : sur demande par email. |
| Accès et portabilité | 🟡 | Pas d'export dans l'app : sur demande par email, avec extraction manuelle depuis le BO. **Action** : export en V2. |
| Désinscription des communications | ✅ | Pas d'email ni de newsletter. Les notifications se désactivent dans les paramètres. |

## 10. Mineurs

| Critère | Statut | Constat / Action |
| --- | --- | --- |
| Âge minimum | ✅ | 18 ans, âge minimum pour donner son sang. Déclaratif (case à l'inscription vérifiée par l'API), sans collecte de date de naissance. Les CGU prévoient la suppression d'un compte de mineur signalé. |
