import type { StatutDonneur } from '../services/profil.service';

// 📖 Traduction "valeur backend → libellé affiché". Objet figé plutôt qu'un
//    switch dispersé dans chaque écran : une seule source de vérité pour le
//    texte + l'emoji du statut donneur.
export const LIBELLE_STATUT_DONNEUR: Record<StatutDonneur, string> = {
  donneur_regulier: '🩸 Donneur régulier',
  quelques_dons: '💧 Quelques dons',
  jamais_donne: '🆕 Nouveau donneur',
};

// 📖 Libellés longs pour les radios de l'écran "Informations personnelles".
export const OPTIONS_STATUT_DONNEUR: { valeur: StatutDonneur; libelle: string }[] = [
  { valeur: 'donneur_regulier', libelle: 'Oui, je suis donneur régulier' },
  { valeur: 'quelques_dons', libelle: "J'ai déjà donné une ou deux fois" },
  { valeur: 'jamais_donne', libelle: "Non, c'est la première fois" },
];

// 📖 Initiale affichée dans l'avatar quand aucune image n'est disponible
//    (même règle que l'AppHeader).
export const initialePseudo = (pseudo: string | undefined | null): string =>
  pseudo ? pseudo.charAt(0).toUpperCase() : '?';
