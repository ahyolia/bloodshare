import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../../constants/colors';

/* -------------------------------------------------------------------------
 * Mesures partagées.
 *
 * La barre est en position absolue : elle flotte au-dessus du contenu et ne
 * réserve donc aucune place. Chaque écran doit ajouter CONTENU_MARGE_BASSE en
 * bas de son scroll, sinon la barre recouvre la fin du contenu (c'est ce qui
 * se passait sur l'écran Don, et c'est le `paddingBottom: 126` en dur de
 * profil.tsx). On exporte le chiffre pour qu'il n'existe qu'à un seul endroit.
 * ---------------------------------------------------------------------- */

export const TAB_BAR_HAUTEUR = 70;
export const TAB_BAR_MARGE_BASSE = 16;
/** Retrait de la pilule par rapport aux bords de l'écran. */
export const TAB_BAR_MARGE_LATERALE = 16;
/**
 * De combien la bulle centrale est remontée par rapport au centre de la
 * pilule. Une partie de cette translation dépasse au-dessus de la barre : on
 * la compte dans la marge de contenu, majorée mais jamais insuffisante.
 */
const BULLE_DEBORDEMENT = 17;
export const CONTENU_MARGE_BASSE =
  TAB_BAR_HAUTEUR + TAB_BAR_MARGE_BASSE + BULLE_DEBORDEMENT + 16;

/** Chaque item doit rester ≥ 48 px de haut (cible tactile WCAG AA). */
const CIBLE_TACTILE_MIN = 48;

/* -------------------------------------------------------------------------
 * Géométrie de la bulle du Don et de son raccord avec la pilule.
 *
 * La bulle est un disque sombre (couleur de la barre) portant un disque crème
 * en son centre. C'est volontairement DEUX vues empilées et non une seule vue
 * bordée : React Native peint le fond jusqu'au bord extérieur de la bordure,
 * si bien que le crème transparaissait dans l'anti-crénelage du contour et
 * dessinait un liseré clair tout autour de la bulle — exactement ce qui
 * cassait la fusion avec la barre.
 *
 * Là où le disque sombre coupe le bord haut de la pilule, deux formes se
 * rejoignent en pointe. On adoucit chaque pointe par un RACCORD : l'arc d'un
 * cercle de rayon RACCORD_RAYON, tangent à la fois au bord haut de la barre et
 * au disque. Les cotes ci-dessous sont calculées, pas réglées à l'œil — si on
 * change la hauteur de la barre, le diamètre de la bulle ou son débordement,
 * le raccord reste juste.
 * ---------------------------------------------------------------------- */

const BULLE_DIAMETRE = 65;
const BULLE_RAYON = BULLE_DIAMETRE / 2;
/** Épaisseur de l'anneau sombre entre la pilule et le disque crème. */
const ANNEAU_EPAISSEUR = 4;
/** Ordonnée du centre de la bulle, mesurée depuis le bord haut de la barre. */
const BULLE_CENTRE_Y = TAB_BAR_HAUTEUR / 2 - BULLE_DEBORDEMENT;

/** Plus il est grand, plus la jonction est douce. */
const RACCORD_RAYON = 12;
/**
 * Écart horizontal entre le centre de la bulle et le point où le raccord
 * retrouve le bord haut de la barre. Son centre est à distance
 * (BULLE_RAYON + RACCORD_RAYON) du centre de la bulle — deux cercles tangents
 * extérieurement — et à RACCORD_RAYON du bord haut, d'où Pythagore.
 */
const RACCORD_DX = Math.sqrt(
  (BULLE_RAYON + RACCORD_RAYON) ** 2 - (RACCORD_RAYON + BULLE_CENTRE_Y) ** 2
);
/**
 * Largeur utile du raccord : au-delà, l'arc touche le disque et c'est le
 * disque lui-même qui fournit la matière. Déborder ici peindrait une écaille
 * sombre en dehors de la silhouette.
 */
const RACCORD_LARGEUR =
  (RACCORD_DX * RACCORD_RAYON) / (BULLE_RAYON + RACCORD_RAYON);

/**
 * 📖 Jeu d'icônes : MaterialCommunityIcons plutôt qu'Ionicons. Son tracé est
 * plus arrondi et plus doux, et surtout chaque pictogramme utilisé ici existe
 * en paire `nom` (plein) / `nom-outline` (contour) — c'est ce qui permet à
 * l'onglet actif de se remplir. Avant d'ajouter un onglet, vérifier que les
 * DEUX variantes existent, sinon l'état actif se casse silencieusement.
 */
type NomIcone = keyof typeof MaterialCommunityIcons.glyphMap;

/**
 * L'onglet est-il celui de la page affichée ?
 *
 * ⚠️ React Navigation 7 transmet l'état sélectionné aux `tabBarButton` par la
 * prop `aria-selected` uniquement (BottomTabItem.js). La v6 utilisait
 * `accessibilityState.selected`, qui n'existe plus : la lire renvoyait
 * `undefined`, donc tous les onglets se rendaient en permanence dans leur
 * état inactif — icône en contour, libellé maigre, aucun repère de page
 * courante.
 */
function estActif(props: any) {
  return props['aria-selected'] === true;
}

/**
 * Icône + libellé d'un onglet standard.
 *
 * L'état actif ne repose PAS sur la seule couleur : l'icône passe de la
 * variante contour à la variante pleine et le libellé monte en graisse — deux
 * repères visibles même en niveaux de gris.
 *
 * ⚠️ Ce composant est branché sur `tabBarButton`, PAS sur `tabBarIcon`, et
 * c'est ce qui permet de le centrer verticalement. Ce que React Navigation
 * reçoit dans `tabBarIcon` est enfermé dans une boîte fixe de 31 × 28 px, en
 * position absolue, et rendu deux fois (variante active et inactive
 * superposées en fondu) : une icône surmontée d'un libellé y déborde et reste
 * collée en haut de la barre, quoi qu'on écrive comme style. `tabBarButton`
 * remplace le bouton entier, donc on maîtrise la mise en page.
 */
function BoutonOnglet({
  icone,
  label,
  ...props
}: any & { icone: NomIcone; label: string }) {
  const focused = estActif(props);
  const couleur = focused ? Theme.navigation.actif : Theme.navigation.inactif;

  return (
    <Pressable
      onPress={props.onPress}
      onLongPress={props.onLongPress}
      style={styles.item}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
    >
      <MaterialCommunityIcons
        name={focused ? icone : (`${icone}-outline` as NomIcone)}
        size={24}
        color={couleur}
      />
      <Text
        style={[styles.label, { color: couleur }, focused && styles.labelActif]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Bouton central du Don.
 *
 * Seul onglet sans libellé visible : la bulle se suffit à elle-même et le mot
 * « Don » collé dessous alourdissait la barre. C'est donc l'`accessibilityLabel`
 * qui porte seul le nom pour VoiceOver / TalkBack — à ne pas retirer, sinon le
 * bouton de l'action principale de l'app redevient muet (c'était le cas avec
 * l'ancien `title: ''`).
 *
 * Son anneau est décoratif et permanent : c'est la GOUTTE qui signale la page
 * courante, en passant du contour atténué au plein sombre. Repère de forme
 * doublé d'un repère de couleur, donc lisible en niveaux de gris.
 */
function BoutonDon({ onPress, ...props }: any) {
  const focused = estActif(props);

  return (
    <Pressable
      onPress={onPress}
      style={styles.itemDon}
      accessibilityRole="tab"
      accessibilityLabel="Don"
      accessibilityHint="Vérifier son éligibilité, prendre rendez-vous ou valider un don"
      accessibilityState={{ selected: focused }}
    >
      {/* 📖 Les deux raccords sont posés avant la bulle : ils vivent dans la
          bande située au-dessus du bord haut de la barre, de part et d'autre
          du disque. */}
      <View style={[styles.raccord, styles.raccordGauche]} pointerEvents="none">
        <View style={[styles.raccordArc, styles.raccordArcGauche]} />
      </View>
      <View style={[styles.raccord, styles.raccordDroit]} pointerEvents="none">
        <View style={[styles.raccordArc, styles.raccordArcDroit]} />
      </View>

      <View style={styles.bulle}>
        <View style={styles.bulleInterieur}>
          <MaterialCommunityIcons
            name={focused ? 'water' : 'water-outline'}
            size={28}
            color={
              focused
                ? Theme.navigation.bulleIconeActif
                : Theme.navigation.bulleIcone
            }
          />
        </View>
      </View>
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // 📖 Icônes et libellés sont rendus par nos propres `tabBarButton`
        // (cf. BoutonOnglet), donc les options d'icône et de libellé de la
        // barre ne servent plus à rien : ne pas essayer de régler l'apparence
        // avec `tabBarIcon`, `tabBarLabelStyle` ou `tabBarActiveTintColor`.
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarButton: (props) => (
            <BoutonOnglet {...props} icone="home-variant" label="Accueil" />
          ),
        }}
      />
      {/* 📖 `accueil/` n'est pas un onglet : c'est la pile des pages de détail
          de l'accueil (actualité, événement). Comme expo-router transforme
          TOUT dossier de app/tabs/ en onglet, il faut le masquer
          explicitement — sinon un 6e bouton apparaît à droite du profil et ne
          mène nulle part (le dossier n'a pas d'index). `href: null` retire le
          bouton mais garde les routes navigables. */}
      <Tabs.Screen name="accueil" options={{ href: null }} />
      <Tabs.Screen
        name="quiz"
        options={{
          title: 'Quiz',
          tabBarButton: (props) => (
            <BoutonOnglet {...props} icone="lightbulb" label="Quiz" />
          ),
        }}
      />
      <Tabs.Screen
        name="don"
        options={{
          title: 'Don',
          tabBarButton: (props) => <BoutonDon {...props} />,
        }}
        // 📖 Chaque onglet garde son propre historique de navigation. Sans ce
        // listener, revenir sur Don après un détour par Accueil réaffiche
        // l'écran où on s'était arrêté (ex : le résultat du questionnaire) au
        // lieu du hub Don. On force donc le retour à "index" à chaque appui.
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('don', { screen: 'index' });
          },
        })}
      />
      <Tabs.Screen
        name="cartes"
        options={{
          title: 'Cartes',
          tabBarButton: (props) => (
            <BoutonOnglet {...props} icone="cards" label="Cartes" />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarButton: (props) => (
            <BoutonOnglet {...props} icone="account-circle" label="Profil" />
          ),
        }}
      />
    </Tabs>
  );
}

/** 📖 Exporté pour que les écrans qui masquent la barre (scan QR) la restaurent à l'identique. */
export const TAB_BAR_STYLE = {
  position: 'absolute' as const,
  // 📖 Les marges latérales passent par `marginHorizontal` et NON par
  // `left` / `right` : la barre porte déjà `start: 0, end: 0`
  // (BottomTabBar.js), et en React Native les propriétés logiques
  // `start` / `end` l'emportent sur `left` / `right`. Un `left: 20` était donc
  // ignoré et la pilule restait collée aux deux bords de l'écran. La marge,
  // elle, s'applique par-dessus le positionnement — et reste correcte en RTL.
  marginHorizontal: TAB_BAR_MARGE_LATERALE,
  bottom: TAB_BAR_MARGE_BASSE,
  height: TAB_BAR_HAUTEUR,
  borderTopWidth: 0,
  // 📖 Pilule pleine : le rayon vaut la moitié de la hauteur, sinon les coins
  // « cassent » et on retombe sur un rectangle arrondi.
  borderRadius: TAB_BAR_HAUTEUR / 2,
  backgroundColor: Theme.navigation.fond,
  paddingHorizontal: 8,
  // 📖 React Navigation applique `paddingBottom: insets.bottom` à la barre
  // (BottomTabBar.js). Utile pour une barre collée au bas de l'écran, mais ici
  // la pilule flotte au-dessus de la zone sûre : ce padding ne faisait que
  // pousser les icônes vers le haut, hors du centre. On le neutralise.
  paddingTop: 0,
  paddingBottom: 0,
  // 📖 La bulle dépasse en haut : sans overflow visible, Android la rogne.
  overflow: 'visible' as const,
  shadowColor: Theme.texte.principal,
  shadowOpacity: 0.22,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 10,
};

const styles = StyleSheet.create({
  tabBar: TAB_BAR_STYLE,
  // 📖 Conteneur que React Navigation place autour de chaque `tabBarButton`.
  // On lui fixe la hauteur de la pilule pour que nos boutons s'y appuient.
  tabItem: {
    height: TAB_BAR_HAUTEUR,
    minHeight: CIBLE_TACTILE_MIN,
  },
  item: {
    // 📖 Occupe toute la hauteur de la pilule : c'est ce qui rend le centrage
    // vertical possible. Sans hauteur explicite, le bouton se réduit à son
    // contenu et se cale en haut de l'onglet.
    height: TAB_BAR_HAUTEUR,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: CIBLE_TACTILE_MIN,
    minWidth: CIBLE_TACTILE_MIN,
    gap: 2,
  },
  label: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '500',
  },
  labelActif: {
    fontWeight: '700',
  },
  itemDon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: TAB_BAR_HAUTEUR,
  },
  // 📖 Disque sombre extérieur = l'anneau. Aucune ombre : elle dessinerait un
  // halo tout autour et ruinerait la fusion avec la pilule, dont l'anneau doit
  // paraître être le prolongement.
  bulle: {
    width: BULLE_DIAMETRE,
    height: BULLE_DIAMETRE,
    borderRadius: BULLE_RAYON,
    backgroundColor: Theme.navigation.bulleAnneau,
    // 📖 Remonte la bulle pour qu'elle chevauche le bord haut de la pilule.
    // `translateY` et non `marginTop` : la marge négative modifierait la
    // hauteur de la boîte, donc le centrage vertical calculé juste au-dessus.
    // La translation, elle, déplace le rendu sans toucher à la mise en page.
    transform: [{ translateY: -BULLE_DEBORDEMENT }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Disque crème intérieur — celui qui porte la goutte. */
  bulleInterieur: {
    width: BULLE_DIAMETRE - ANNEAU_EPAISSEUR * 2,
    height: BULLE_DIAMETRE - ANNEAU_EPAISSEUR * 2,
    borderRadius: BULLE_RAYON - ANNEAU_EPAISSEUR,
    backgroundColor: Theme.navigation.bulleFond,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* -----------------------------------------------------------------------
   * Raccords bulle ↔ barre.
   *
   * Chacun est une petite fenêtre posée au-dessus du bord haut de la pilule,
   * dans laquelle on montre un ANNEAU épais (`raccordArc`) dont le trou est le
   * cercle de raccordement. Ce qu'on voit de l'anneau à travers la fenêtre est
   * donc « le carré moins le disque » : une matière sombre bordée d'un arc
   * creux, exactement le congé recherché. C'est le seul moyen d'obtenir un
   * angle rentrant sans SVG ni masque, la découpe devant laisser passer le
   * contenu de la page qui défile derrière la barre.
   * -------------------------------------------------------------------- */
  raccord: {
    position: 'absolute',
    top: -RACCORD_RAYON,
    width: RACCORD_LARGEUR,
    height: RACCORD_RAYON,
    overflow: 'hidden',
    left: '50%',
  },
  raccordGauche: {
    transform: [{ translateX: -RACCORD_DX }],
  },
  raccordDroit: {
    transform: [{ translateX: RACCORD_DX - RACCORD_LARGEUR }],
  },
  /**
   * L'anneau : trou de rayon RACCORD_RAYON, matière sur RACCORD_RAYON de plus.
   * Cette épaisseur suffit à couvrir tout le reste de la fenêtre (son coin le
   * plus éloigné du centre du trou est à ~1,4 × RACCORD_RAYON).
   */
  raccordArc: {
    position: 'absolute',
    width: RACCORD_RAYON * 4,
    height: RACCORD_RAYON * 4,
    borderRadius: RACCORD_RAYON * 2,
    borderWidth: RACCORD_RAYON,
    borderColor: Theme.navigation.bulleAnneau,
    // 📖 Centre du trou calé sur le coin haut de la fenêtre côté extérieur :
    // c'est là que l'arc doit être tangent au bord haut de la barre.
    top: -RACCORD_RAYON * 2,
  },
  raccordArcGauche: {
    left: -RACCORD_RAYON * 2,
  },
  raccordArcDroit: {
    right: -RACCORD_RAYON * 2,
  },
});
