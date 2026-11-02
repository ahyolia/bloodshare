{{--
    📖 Palette Aïma pour le backoffice, injectée après les styles de Filament.

    Mode clair uniquement (:root:not(.dark)) : les gris de Filament deviennent les neutres
    de l'app (bloodshare-mobile/constants/palette.ts) — fond beige, textes aubergine.
    Le mode sombre garde les gris (noir/zinc) de Filament ; seuls l'élément actif du menu et
    les boutons principaux y suivent le design system (beige / aubergine, plus bas).
    Les variables sont au format « r, g, b » attendu par Filament.

    Contrastes vérifiés (WCAG AA ≥ 4,5:1) :
    - gray-500 #7A6870 (textes secondaires) : 4,6:1 sur le fond beige #F6F1E4, 5,2:1 sur blanc
    - gray-950 #3E2430 (titres) : 12,4:1 sur le fond beige
--}}
<style>
    :root:not(.dark) {
        --gray-50: 250, 246, 238;   /* #FAF6EE — en-têtes de tableau, lignes survolées (sur cartes blanches) */
        --gray-100: 240, 237, 238;  /* #F0EDEE neutre 100 */
        --gray-200: 232, 228, 230;  /* #E8E4E6 neutre 200 — bordures */
        --gray-300: 211, 202, 206;  /* #D3CACE */
        --gray-400: 185, 175, 180;  /* #B9AFB4 neutre 400 — icônes, placeholders */
        --gray-500: 122, 104, 112;  /* #7A6870 — textes secondaires */
        --gray-600: 106, 85, 96;    /* #6A5560 aubergine 500 */
        --gray-700: 87, 69, 80;     /* #574550 */
        --gray-800: 74, 53, 64;     /* #4A3540 */
        --gray-900: 67, 44, 55;     /* #432C37 */
        --gray-950: 62, 36, 48;     /* #3E2430 aubergine 900 — couleur de texte officielle */
    }

    /* 📖 Trois niveaux en mode clair : page beige › carte blanche › en-tête crème (gray-50).
          Filament met la page ET les en-têtes de tableau en gray-50 : on fixe donc le fond
          de page à part, sinon l'en-tête du tableau se confond avec le fond de l'app. */
    :root:not(.dark) .fi-body {
        background-color: #F6F1E4; /* neutre 50 */
    }

    /* 📖 Barre de défilement : le gris clair du navigateur disparaît sur le beige.
          Pouce aubergine 300 (#8A7A82, 3,6:1 sur le beige, ≥ 3:1 exigé pour un élément d'interface). */
    :root:not(.dark),
    :root:not(.dark) * {
        scrollbar-color: #8A7A82 transparent;
    }

    /* 📖 Icônes du menu : Filament les met en gray-400, trop pâle sur le fond beige (≈ 2:1).
          gray-500 donne 4,6:1. Ciblé sur la barre latérale pour ne pas foncer aussi les
          placeholders des champs, qui utilisent le même gris. */
    :root:not(.dark) .fi-sidebar-item:not(.fi-active) .fi-sidebar-item-icon,
    :root:not(.dark) .fi-sidebar-group-icon,
    :root:not(.dark) .fi-sidebar-group-collapse-button svg,
    /* Icônes des liens d'action gris (« Modifier », voir AdminPanelProvider::boot) */
    :root:not(.dark) .fi-link-icon.text-gray-400 {
        color: rgb(var(--gray-500));
    }

    /* 📖 Design system de l'app : l'action principale est aubergine pleine, texte crème.
          En sombre, on inverse : fond beige, texte aubergine. Contraste ≈ 12:1 dans les deux cas.
          S'applique à l'élément actif du menu et aux boutons pleins « primary » (Connexion,
          Créer, Enregistrer…). Le corail reste l'accent : liens, cases cochées, focus. */
    :root {
        --aima-aubergine: #3E2430;
        --aima-aubergine-survol: #57384A;
        --aima-beige: #F6F1E4;
        --aima-creme: #FFFDF7;
    }

    /* 📖 Filament n'ajoute la largeur de la barre latérale (w-[--sidebar-width]) qu'une fois
          Alpine.js chargé : à chaque changement de page, elle s'affichait d'abord à la largeur
          de son contenu puis s'élargissait, ce qui se voit avec l'élément actif aubergine.
          On fixe la largeur dès le premier rendu, sur ordinateur (lg = 1024 px, la barre y est
          toujours ouverte dans ce panel ; sur mobile c'est un tiroir géré par Alpine). */
    @media (min-width: 1024px) {
        .fi-sidebar {
            width: var(--sidebar-width);
        }
    }

    /* Élément actif du menu */
    :root:not(.dark) .fi-sidebar-item.fi-active > .fi-sidebar-item-button {
        background-color: var(--aima-aubergine);
    }
    :root:not(.dark) .fi-sidebar-item.fi-active > .fi-sidebar-item-button :is(.fi-sidebar-item-icon, .fi-sidebar-item-label) {
        color: var(--aima-beige);
    }
    .dark .fi-sidebar-item.fi-active > .fi-sidebar-item-button {
        background-color: var(--aima-beige);
    }
    .dark .fi-sidebar-item.fi-active > .fi-sidebar-item-button :is(.fi-sidebar-item-icon, .fi-sidebar-item-label) {
        color: var(--aima-aubergine);
    }

    /* Boutons pleins « primary » (pas les boutons à contour, ni les boutons-cases <label>) */
    :root:not(.dark) :is(button, a).fi-btn.fi-color-primary:not(.fi-btn-outlined) {
        background-color: var(--aima-aubergine);
        color: var(--aima-creme);
    }
    :root:not(.dark) :is(button, a).fi-btn.fi-color-primary:not(.fi-btn-outlined):hover {
        background-color: var(--aima-aubergine-survol);
    }
    .dark :is(button, a).fi-btn.fi-color-primary:not(.fi-btn-outlined) {
        background-color: var(--aima-beige);
        color: var(--aima-aubergine);
    }
    .dark :is(button, a).fi-btn.fi-color-primary:not(.fi-btn-outlined):hover {
        background-color: var(--aima-creme);
    }
    :is(button, a).fi-btn.fi-color-primary:not(.fi-btn-outlined) :is(.fi-btn-icon, svg) {
        color: inherit;
    }
</style>
