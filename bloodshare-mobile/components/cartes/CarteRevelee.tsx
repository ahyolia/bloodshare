import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { AccessibilityInfo, Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { Theme } from '../../constants/colors';
import { Palette } from '../../constants/palette';
import { Espace, Ombre, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import { RATIO_CARTE } from './CartePortrait';

// 📖 Embarqué dans l'app (pas envoyé par le backoffice) : le dos est le même pour toutes
//    les cartes et doit s'afficher tout de suite, même hors ligne.
const DOS_CARTE = require('../../assets/images/dos-carte.png');

/** Épaisseur du cadre blanc de la carte en grand. */
const CADRE = 11;
/** Durée du retournement de la carte (ms). */
export const DUREE_RETOURNEMENT = 700;

/**
 * Nom écrit sur le sticker : le titre sans « Carte » devant, plus court
 * (« Carte Forum IUT » → « Forum IUT », « Carte de Novembre » → « Novembre »).
 */
export const nomCourt = (titre: string) => titre.replace(/^Carte\s+(de\s+|d['’])?/i, '') || titre;

/** Durée de l'arrivée « en vol » (ms). */
const DUREE_VOL = 650;

const ARRIVEE_ZOOM = ZoomIn.springify().damping(13).stiffness(200).reduceMotion(ReduceMotion.System);

type Props = {
  imageUrl: string | null;
  /** Nom complet, lu par le lecteur d'écran. */
  titre: string;
  /** Texte du sticker collé sous la carte. */
  sticker: string;
  largeur: number;
  /** Attente avant que la carte se retourne (ms). */
  delai?: number;
  /** `zoom` : ouverture depuis la collection ; `vol` : obtention d'une carte. */
  arrivee?: 'zoom' | 'vol';
};

// 📖 Carte en grand, révélée en trois temps :
//    1. elle arrive de dos (en grandissant, ou en vol pour une obtention) ;
//    2. elle se retourne en 3D et dévoile son dessin, le sticker se colle avec un rebond ;
//    3. un reflet balaie le dessin, puis elle flotte doucement, légèrement penchée.
//    Elle se manipule ensuite au doigt (voir `geste`).
//    « Réduire les animations » : la carte s'affiche directement de face, immobile.
//    ⚠️ Doit être placée sous un GestureHandlerRootView.
export function CarteRevelee({ imageUrl, titre, sticker, largeur, delai = 300, arrivee = 'zoom' }: Props) {
  // Rotation en degrés = révélation (180 = de dos → 0 = de face) + ce que le doigt en fait.
  const revelation = useSharedValue(180);
  const angleGeste = useSharedValue(0);
  const angleX = useSharedValue(0);
  // Déplacement suivant le doigt, et angle au début du geste.
  const decalageX = useSharedValue(0);
  const decalageY = useSharedValue(0);
  const angleDepart = useSharedValue(0);
  const reflet = useSharedValue(0);
  const flottement = useSharedValue(0);
  // Arrivée « en vol » : 0 = au loin, 1 = posée. Déjà posée pour l'arrivée en zoom.
  const vol = useSharedValue(arrivee === 'vol' ? 0 : 1);

  useEffect(() => {
    let actif = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduire) => {
        if (!actif) return;
        if (reduire) {
          vol.value = 1;
          revelation.value = 0;
          return;
        }
        vol.value = withTiming(1, { duration: DUREE_VOL, easing: Easing.out(Easing.cubic) });
        revelation.value = withDelay(
          delai,
          withTiming(0, { duration: DUREE_RETOURNEMENT, easing: Easing.inOut(Easing.cubic) })
        );
        reflet.value = withDelay(
          delai + DUREE_RETOURNEMENT,
          withTiming(1, { duration: 650, easing: Easing.out(Easing.quad) })
        );
        flottement.value = withDelay(
          delai + DUREE_RETOURNEMENT,
          withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }), -1, true)
        );
      })
      // Sans réponse : la carte s'affiche de face, plutôt que de rester de dos.
      .catch(() => {
        vol.value = 1;
        revelation.value = 0;
      });

    return () => {
      actif = false;
      cancelAnimation(vol);
      cancelAnimation(revelation);
      cancelAnimation(reflet);
      cancelAnimation(flottement);
    };
  }, [vol, revelation, reflet, flottement, delai]);

  // 📖 Arrivée « en vol » pour l'obtention d'une carte : elle tombe de très près, penchée,
  //    dépasse un peu sa taille puis se pose (comme le tirage d'une carte dans un jeu).
  //    Valeur animée et non animation d'entrée (Keyframe) : sur le web, avec la Keyframe,
  //    la carte chevauchait les textes autour.
  const styleArrivee = useAnimatedStyle(() => ({
    opacity: interpolate(vol.value, [0, 0.4, 1], [0, 1, 1]),
    transform: [
      { scale: interpolate(vol.value, [0, 0.55, 0.8, 1], [2.2, 0.92, 1.04, 1]) },
      { rotate: `${interpolate(vol.value, [0, 0.55, 0.8, 1], [-28, 5, -2, 0])}deg` },
    ],
  }));

  // 📖 La carte se manipule au doigt : glisser la fait suivre un peu et pivoter en 3D
  //    (de gauche à droite : elle tourne sur elle-même, jusqu'à montrer son dos ; de haut
  //    en bas : elle bascule, limitée à 35°). Au lâcher, elle se pose sur la face la plus
  //    proche, en gardant l'élan, et revient au centre avec un ressort.
  const geste = Gesture.Pan()
    .onBegin(() => {
      cancelAnimation(angleGeste);
      angleDepart.value = angleGeste.value;
    })
    .onUpdate((e) => {
      angleGeste.value = angleDepart.value + e.translationX * 0.6;
      angleX.value = Math.max(-35, Math.min(35, -e.translationY * 0.3));
      decalageX.value = e.translationX * 0.25;
      decalageY.value = e.translationY * 0.25;
    })
    .onFinalize((e) => {
      // L'élan du geste prolonge la rotation, puis la carte se pose de face ou de dos.
      const angleVise = Math.round((angleGeste.value + e.velocityX * 0.1) / 180) * 180;
      angleGeste.value = withSpring(angleVise, { damping: 16, stiffness: 120 });
      angleX.value = withSpring(0, { damping: 14, stiffness: 160 });
      decalageX.value = withSpring(0, { damping: 14, stiffness: 160 });
      decalageY.value = withSpring(0, { damping: 14, stiffness: 160 });
    });

  const styleCarte = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { translateX: decalageX.value },
      { translateY: decalageY.value + flottement.value * -6 },
      { rotate: `${-2 + flottement.value * 1.5}deg` },
      { rotateX: `${angleX.value}deg` },
      { rotateY: `${revelation.value + angleGeste.value}deg` },
    ],
  }));
  // 📖 On voit la face tant qu'elle est tournée vers nous (cos > 0), le dos sinon : plus
  //    fiable sur le web que backfaceVisibility, et ça marche après plusieurs tours. Le
  //    dos est remis à l'endroit (scaleX -1) : sinon on lirait « Aïma » en miroir.
  const styleRecto = useAnimatedStyle(() => ({
    opacity: Math.cos(((revelation.value + angleGeste.value) * Math.PI) / 180) >= 0 ? 1 : 0,
  }));
  // Même règle pour le sticker (un style animé ne s'applique qu'à une seule vue).
  const styleSticker = useAnimatedStyle(() => ({
    opacity: Math.cos(((revelation.value + angleGeste.value) * Math.PI) / 180) >= 0 ? 1 : 0,
  }));
  const styleVerso = useAnimatedStyle(() => ({
    opacity: Math.cos(((revelation.value + angleGeste.value) * Math.PI) / 180) < 0 ? 1 : 0,
    transform: [{ scaleX: -1 }],
  }));
  const styleReflet = useAnimatedStyle(() => ({
    opacity: reflet.value > 0 && reflet.value < 1 ? 1 : 0,
    transform: [{ translateX: -largeur * 0.5 + reflet.value * largeur * 1.6 }, { rotate: '20deg' }],
  }));

  return (
    // 📖 Hauteur explicite (et pas seulement le ratio de la carte) : sur le web, dans une
    //    zone qui défile, la carte ne réservait pas sa place et recouvrait les textes.
    <Animated.View
      entering={arrivee === 'zoom' ? ARRIVEE_ZOOM : undefined}
      style={[{ width: largeur, height: largeur / RATIO_CARTE }, styleArrivee]}
    >
      <GestureDetector gesture={geste}>
        <Animated.View style={[styles.carte, styleCarte]} accessibilityHint="Glisse la carte pour la faire tourner">
          <Animated.View style={[styles.fenetre, styleRecto]}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" accessibilityLabel={titre} />
            ) : (
              <View style={styles.sansVisuel}>
                <Ionicons name="water" size={56} color={Theme.marque.principal} />
              </View>
            )}
            {/* Reflet qui balaie le dessin une fois la carte retournée. */}
            <Animated.View style={[styles.reflet, { width: largeur * 0.35 }, styleReflet]} pointerEvents="none" />
          </Animated.View>

          <Animated.View style={[styles.dos, styleVerso]} pointerEvents="none">
            <Image source={DOS_CARTE} style={styles.image} resizeMode="cover" accessible={false} />
          </Animated.View>

          {/* 📖 Sticker collé en bas de la face : le nom de la carte en Pacifico. Il
              tourne avec la carte et disparaît quand on la retourne. Il se colle avec un
              rebond après la révélation. */}
          <Animated.View style={[styles.stickerZone, styleSticker]} pointerEvents="none">
            <Animated.View
              entering={ZoomIn.delay(delai + DUREE_RETOURNEMENT)
                .springify()
                .damping(9)
                .stiffness(180)
                .reduceMotion(ReduceMotion.System)}
              style={styles.sticker}
            >
              <Text style={[Typo.titre1, styles.stickerTexte]} accessibilityRole="header">
                {sticker}
              </Text>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Cadre blanc autour du dessin, comme une vraie carte à collectionner.
  carte: {
    flex: 1,
    padding: CADRE,
    borderRadius: Rayon.lg + CADRE,
    borderWidth: 1,
    borderColor: Theme.fond.bordure,
    backgroundColor: Palette.neutre.blanc,
    ...Ombre.modale,
  },
  fenetre: {
    flex: 1,
    borderRadius: Rayon.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  sansVisuel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.marque.doux,
  },
  // Dos de la carte (illustration Aïma), dans le même cadre blanc que la face.
  dos: {
    position: 'absolute',
    top: CADRE,
    left: CADRE,
    right: CADRE,
    bottom: CADRE,
    borderRadius: Rayon.lg,
    overflow: 'hidden',
    backgroundColor: Palette.corail[500],
  },
  // Bande blanche translucide, penchée, plus haute que la carte pour couvrir les coins.
  reflet: {
    position: 'absolute',
    top: '-25%',
    bottom: '-25%',
    left: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  // Sticker à cheval sur le bas de la carte, un peu de travers : blanc, liseré aubergine clair.
  stickerZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -24,
    alignItems: 'center',
  },
  sticker: {
    paddingHorizontal: Espace[4],
    paddingVertical: 2,
    borderRadius: Rayon.plein,
    borderWidth: 3,
    borderColor: Palette.aubergine[500],
    backgroundColor: Palette.neutre.blanc,
    transform: [{ rotate: '-5deg' }],
    ...Ombre.flottante,
  },
  stickerTexte: { color: Theme.texte.principal },
});
