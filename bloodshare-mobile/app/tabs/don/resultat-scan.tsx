import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeInDown, ReduceMotion } from 'react-native-reanimated';
import { RATIO_CARTE } from '../../../components/cartes/CartePortrait';
import { CarteRevelee, DUREE_RETOURNEMENT, nomCourt } from '../../../components/cartes/CarteRevelee';
import { EclatRevelation } from '../../../components/cartes/EclatRevelation';
import { Bouton } from '../../../components/ui/Bouton';
import { Theme } from '../../../constants/colors';
import { Palette } from '../../../constants/palette';
import { Espace, Rayon } from '../../../constants/spacing';
import { Typo } from '../../../constants/typography';
import { useLargeurApp } from '../../../hooks/useLargeurApp';
import { getNomMois } from '../../../utils/mois';
import { TAB_BAR_STYLE } from '../_layout';

/** La carte arrive en vol (650 ms), puis se retourne. */
const DELAI_RETOURNEMENT = 900;
/** Moment où la carte se pose : l'éclat part à cet instant. */
const ATTERRISSAGE = 400;
/** Les textes et boutons arrivent une fois la carte retournée. */
const APRES_REVELATION = DELAI_RETOURNEMENT + DUREE_RETOURNEMENT;

const apparition = (rang: number) =>
  FadeInDown.delay(APRES_REVELATION + rang * 120)
    .duration(350)
    .reduceMotion(ReduceMotion.System);

// 📖 Obtention d'une carte après un scan, mise en scène comme le tirage d'une carte dans un
//    jeu (fond sombre, rayons de lumière, onde, étincelles : voir EclatRevelation) :
//    1. la carte tombe en vol, de dos, et l'éclat part quand elle se pose ;
//    2. elle se retourne et dévoile son dessin, le sticker se colle ;
//    3. les textes et les boutons arrivent.
//    Les badges débloqués ne sont pas montrés ici : leur popup (voir useBadgesAFeter)
//    attend qu'on quitte l'écran, pour que chaque fête ait son moment.
//    Carte déjà possédée : pas d'éclat (rien de nouveau à fêter), juste la carte et la note.
//    Les params arrivent en texte (query string de la navigation), d'où les conversions.
export default function ResultatScanScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { width, height } = useLargeurApp();

  // 📖 Plein écran pendant la mise en scène : la barre d'onglets est masquée (comme sur le
  //    scan) et restaurée à l'identique quand on quitte l'écran.
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
      };
    }, [navigation])
  );

  const {
    type,
    carte_titre,
    carte_image_url,
    carte_mois,
    deja_possedee,
    carte_fidele_titre,
  } = useLocalSearchParams<{
    type: string;
    carte_titre?: string;
    carte_image_url?: string;
    carte_mois?: string;
    deja_possedee: string;
    carte_fidele_titre?: string;
  }>();

  // 📖 Carte déjà possédée : le don est validé, mais pas de nouvelle carte-souvenir ni badge
  //    (les cartes du mois sont uniques, et un don ne rapporte jamais de récompense en double).
  const dejaPossedee = deja_possedee === 'true';
  const mois = carte_mois ? getNomMois(Number(carte_mois)) : undefined;

  const largeur = Math.min(width * 0.62, height * 0.42 * RATIO_CARTE, 280);
  const titre = dejaPossedee ? 'Carte déjà obtenue' : 'Nouvelle carte !';
  const sousTitre = type === 'evenement' ? 'Présence confirmée, merci !' : 'Don validé, merci pour ton geste !';

  return (
    <GestureHandlerRootView style={styles.ecran}>
      {!dejaPossedee && !!carte_titre && <EclatRevelation delai={ATTERRISSAGE} />}

      <ScrollView contentContainerStyle={styles.contenu} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.enTete}>
          <Text style={[Typo.titre1, styles.titre]} accessibilityRole="header">
            {carte_titre ? titre : sousTitre}
          </Text>
          {!!carte_titre && <Text style={[Typo.corps, styles.texteDiscret]}>{sousTitre}</Text>}
        </Animated.View>

        {!!carte_titre && (
          <CarteRevelee
            imageUrl={carte_image_url ?? null}
            titre={carte_titre}
            sticker={mois ?? nomCourt(carte_titre)}
            largeur={largeur}
            delai={DELAI_RETOURNEMENT}
            arrivee="vol"
          />
        )}

        <View style={styles.recompenses}>
          {dejaPossedee && (
            <Animated.Text entering={apparition(0)} style={[Typo.legende, styles.texteDiscret]}>
              {"Tu possèdes déjà cette carte : elle ne peut être obtenue qu'une seule fois. " +
                "Aucun point n'est attribué pour ce don."}
            </Animated.Text>
          )}

          {/* 📖 Hors de la condition dejaPossedee : la carte Fidèle peut tomber un an pile
              après le premier don, donc avec une carte du mois déjà possédée. */}
          {!!carte_fidele_titre && (
            <Animated.View entering={apparition(1)} style={styles.pastille}>
              <Ionicons name="infinite" size={18} color={Palette.lime[500]} />
              <Text style={[Typo.legendeForte, styles.pastilleTexte]}>
                {`En bonus : ${carte_fidele_titre}, merci pour un an de dons !`}
              </Text>
            </Animated.View>
          )}

        </View>

        <Animated.View entering={apparition(2)} style={styles.actions}>
          {/* 📖 replace : une fois sorti, on ne doit pas pouvoir « revenir » sur ce résultat. */}
          <Bouton
            libelle="Voir ma collection"
            variante="secondaire"
            icone="albums"
            onPress={() => router.replace('/tabs/cartes')}
          />
          <Pressable
            onPress={() => router.replace('/tabs')}
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => [styles.lien, pressed && styles.presse]}
          >
            <Text style={[Typo.bouton, styles.lienTexte]}>{"Retour à l'accueil"}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </GestureHandlerRootView>
  );
}

// 📖 Fond sombre : textes crème (≈ 13:1), crème à 75 % pour le secondaire (≈ 8:1).
const TEXTE_DISCRET = `${Theme.texte.surAccent}BF`;

const styles = StyleSheet.create({
  ecran: {
    flex: 1,
    // Aubergine très sombre, le même que le voile de la carte en grand.
    backgroundColor: '#1E1017',
  },
  contenu: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espace[8],
    padding: Espace[6],
    paddingTop: 64,
    paddingBottom: Espace[8],
  },
  enTete: {
    alignItems: 'center',
    gap: Espace[1],
  },
  titre: {
    color: Theme.texte.surAccent,
    textAlign: 'center',
  },
  texteDiscret: {
    color: TEXTE_DISCRET,
    textAlign: 'center',
  },
  recompenses: {
    alignItems: 'center',
    gap: Espace[2],
    // Place pour le sticker, à cheval sous la carte.
    marginTop: Espace[4],
  },
  // Pilule translucide : se détache du fond sans voler la vedette à la carte.
  pastille: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[2],
    paddingHorizontal: Espace[4],
    paddingVertical: Espace[2],
    borderRadius: Rayon.plein,
    backgroundColor: 'rgba(255, 253, 247, 0.12)',
  },
  pastilleTexte: {
    flexShrink: 1,
    color: Theme.texte.surAccent,
  },
  // Bouton à la largeur de son texte, pas étiré : la carte reste la vedette.
  actions: {
    alignItems: 'center',
    gap: Espace[3],
  },
  lien: {
    paddingVertical: Espace[2],
  },
  lienTexte: {
    color: Theme.texte.surAccent,
  },
  presse: { opacity: 0.7 },
});
