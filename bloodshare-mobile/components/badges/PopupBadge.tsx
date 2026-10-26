import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeInDown,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { CATEGORIE_COLOR, infoBadge } from '../../constants/badges';
import { Theme } from '../../constants/colors';
import { Palette } from '../../constants/palette';
import { Espace, Ombre, Rayon } from '../../constants/spacing';
import { Police, Typo } from '../../constants/typography';
import { useProfil } from '../../hooks/useProfil';
import { useReduireAnimations } from '../../hooks/useReduireAnimations';
import type { BadgeAFeter } from '../../services/badges.service';
import { Bouton } from '../ui/Bouton';
import { ConfettisSticker } from './ConfettisSticker';
import { VisuelBadge } from './VisuelBadge';

type Props = {
  badge: BadgeAFeter | null;
  onFermer: () => void;
};

const STICKER = 150;
// Bord blanc du sticker autour du disque.
const BORD_STICKER = 10;
const INCLINAISON = -6;

// Textes : ils glissent en fondu l'un après l'autre, une fois le sticker collé.
const apparition = (rang: number) =>
  FadeInDown.delay(650 + rang * 100).duration(350).reduceMotion(ReduceMotion.System);

// 📖 Animation « sticker qu'on colle » : il arrive grand, penché et décollé (ombre
//    large), se plaque d'un coup en s'écrasant un peu, se pose à sa place, puis un reflet
//    le traverse comme sur un autocollant brillant.
function Sticker({
  imageUrl,
  emoji,
  couleur,
  nom,
}: {
  imageUrl: string | null;
  emoji: string;
  couleur: string;
  nom: string;
}) {
  const reduire = useReduireAnimations();
  const pose = useSharedValue(0);
  const ecrase = useSharedValue(1);
  const reflet = useSharedValue(0);

  useEffect(() => {
    if (reduire === null) return;
    if (reduire) {
      pose.value = 1;
      return;
    }
    // Plaqué en accélérant (on le pose fermement), puis petit écrasement au contact.
    pose.value = withDelay(100, withTiming(1, { duration: 280, easing: Easing.in(Easing.quad) }));
    ecrase.value = withDelay(
      380,
      withSequence(withTiming(0.93, { duration: 90 }), withSpring(1, { damping: 8, stiffness: 220 }))
    );
    reflet.value = withDelay(800, withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }));
    return () => {
      cancelAnimation(pose);
      cancelAnimation(ecrase);
      cancelAnimation(reflet);
    };
  }, [ecrase, pose, reduire, reflet]);

  const styleSticker = useAnimatedStyle(() => ({
    opacity: Math.min(pose.value * 4, 1),
    transform: [
      { rotate: `${INCLINAISON - (1 - pose.value) * 16}deg` },
      { scale: (1 + (1 - pose.value) * 0.7) * ecrase.value },
    ],
  }));

  // Ombre portée : large et diffuse tant que le sticker est « en l'air », nette une fois collé.
  const styleOmbre = useAnimatedStyle(() => ({
    // Disparaît une fois le sticker collé : seule reste son ombre nette (Ombre.flottante).
    opacity: 0.18 * (1 - pose.value),
    transform: [
      { translateY: 10 + (1 - pose.value) * 30 },
      { scale: 1 + (1 - pose.value) * 0.5 },
    ],
  }));

  const styleReflet = useAnimatedStyle(() => ({
    opacity: reflet.value > 0 && reflet.value < 1 ? 0.6 : 0,
    transform: [{ translateX: -STICKER + reflet.value * STICKER * 2 }, { rotate: '20deg' }],
  }));

  return (
    <View style={styles.scene}>
      <ConfettisSticker />
      <Animated.View style={[styles.ombre, styleOmbre]} />
      <Animated.View style={[styles.sticker, styleSticker]}>
        {/* Disque teinté seulement sous l'emoji : l'illustration a déjà son propre fond. */}
        <View style={[styles.disque, !imageUrl && { backgroundColor: `${couleur}2E` }]}>
          <VisuelBadge imageUrl={imageUrl} emoji={emoji} taille={STICKER - 2 * BORD_STICKER} />
          <Animated.View style={[styles.reflet, styleReflet]} />
        </View>
      </Animated.View>
      {/* Nom du badge sur une étiquette collée au bas du sticker, posée juste après lui. */}
      <View style={styles.etiquetteZone} pointerEvents="none">
        <Animated.View
          entering={ZoomIn.delay(520).springify().damping(11).reduceMotion(ReduceMotion.System)}
          style={styles.etiquette}
        >
          <Text style={styles.etiquetteTexte} numberOfLines={2}>
            {nom}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

// 📖 Popup de félicitations quand un badge est débloqué, où qu'il ait été gagné (voir
//    useBadgesAFeter). Bloc blanc sur un voile crème translucide (l'app reste
//    visible derrière) ; le badge se colle par-dessus comme un sticker. Vibration de succès sur mobile. Annoncé comme
//    une alerte aux lecteurs d'écran ; le bouton retour Android ferme aussi.
export function PopupBadge({ badge, onFermer }: Props) {
  const router = useRouter();
  // Pseudo pour personnaliser la félicitation ; « Bravo ! » seul tant qu'il n'est pas chargé.
  const { profil } = useProfil();

  useEffect(() => {
    if (!badge) return;
    // Indisponible sur le web : on ignore simplement l'erreur.
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [badge]);

  if (!badge) return null;

  const info = infoBadge(badge.nom);
  const couleur = CATEGORIE_COLOR[info.categorie];

  const voirMesBadges = () => {
    onFermer();
    router.push('/tabs/profil/badges');
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={onFermer} statusBarTranslucent>
      <Animated.View key={badge.notificationId} entering={FadeIn.duration(250)} style={styles.voile}>
        <Animated.View entering={FadeInDown.duration(300).reduceMotion(ReduceMotion.System)} style={styles.bloc}>
          <View
            style={styles.contenu}
            accessibilityRole="alert"
            accessibilityLabel={`Nouveau badge débloqué : ${badge.nom}. ${info.description}`}
          >
            <Sticker imageUrl={badge.image_url} emoji={info.emoji} couleur={couleur} nom={badge.nom} />

            {/* 📖 Ordre de lecture : le badge (sticker et son nom), puis la félicitation,
                puis le détail. « Bravo ! » en Nunito gras : la police de titre est
                réservée au nom du badge, pour qu'il reste l'information principale. */}
            <Animated.Text entering={apparition(0)} style={[Typo.titre2, styles.titre]}>
              {profil?.pseudo ? `Bravo, ${profil.pseudo} !` : 'Bravo !'}
            </Animated.Text>
            <Animated.Text entering={apparition(1)} style={[Typo.corps, styles.annonce]}>
              Tu as débloqué un nouveau badge
            </Animated.Text>
            <Animated.Text entering={apparition(2)} style={[Typo.corps, styles.description]}>
              {info.description}
            </Animated.Text>
          </View>

          <Animated.View entering={apparition(3)} style={styles.actions}>
            <Bouton libelle="Super !" onPress={onFermer} />
            <Bouton libelle="Voir mes badges" variante="discret" onPress={voirMesBadges} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  voile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Espace[6],
    // Crème du fond de l'app à 75 % : l'écran reste visible derrière le bloc.
    backgroundColor: 'rgba(246, 241, 228, 0.75)',
  },
  bloc: {
    width: '100%',
    maxWidth: 340,
    paddingHorizontal: Espace[6],
    paddingTop: Espace[4],
    paddingBottom: Espace[6],
    borderRadius: 28,
    backgroundColor: Palette.neutre.blanc,
    ...Ombre.modale,
  },
  contenu: {
    alignItems: 'center',
  },
  scene: {
    width: 220,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ombre: {
    position: 'absolute',
    width: STICKER,
    height: STICKER,
    borderRadius: Rayon.plein,
    backgroundColor: Palette.aubergine[900],
  },
  sticker: {
    width: STICKER,
    height: STICKER,
    borderRadius: Rayon.plein,
    padding: BORD_STICKER,
    backgroundColor: Palette.neutre.blanc,
    ...Ombre.flottante,
  },
  disque: {
    flex: 1,
    borderRadius: Rayon.plein,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  reflet: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    width: 36,
    backgroundColor: Palette.neutre.blanc,
  },
  titre: {
    color: Theme.texte.principal,
    marginTop: Espace[2],
    marginBottom: Espace[2],
  },
  annonce: {
    color: Theme.texte.secondaire,
    textAlign: 'center',
  },
  // Zone sous le sticker, sur toute la largeur de la scène, pour centrer l'étiquette.
  etiquetteZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 6,
    alignItems: 'center',
  },
  // 📖 Étiquette blanche (pas de fond coloré), légèrement penchée dans l'autre sens que
  //    le sticker, avec une ombre pour se détacher du sticker blanc qu'elle chevauche.
  etiquette: {
    maxWidth: 240,
    paddingHorizontal: Espace[4],
    paddingVertical: 2,
    borderRadius: Rayon.plein,
    backgroundColor: Palette.neutre.blanc,
    transform: [{ rotate: '-2deg' }],
    ...Ombre.flottante,
  },
  etiquetteTexte: {
    fontFamily: Police.titre,
    fontSize: 20,
    lineHeight: 32,
    color: Theme.texte.principal,
    textAlign: 'center',
  },
  // Texte principal plutôt que gris : c'est le « pourquoi » du badge, il doit se lire.
  description: {
    color: Theme.texte.principal,
    textAlign: 'center',
    marginTop: Espace[4],
  },
  actions: {
    gap: Espace[1],
    marginTop: Espace[6],
  },
});
