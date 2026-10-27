import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeInDown, ReduceMotion } from 'react-native-reanimated';
import { RATIO_CARTE } from '../../../components/cartes/CartePortrait';
import { CarteRevelee, DUREE_RETOURNEMENT, nomCourt } from '../../../components/cartes/CarteRevelee';
import { Theme } from '../../../constants/colors';
import { Espace, Ombre, Rayon } from '../../../constants/spacing';
import { Typo } from '../../../constants/typography';
import { useLargeurApp } from '../../../hooks/useLargeurApp';
import { getCartesCache } from '../../../services/cartes.service';
import { formaterDateLongue } from '../../../utils/dates';
import { getNomMois } from '../../../utils/mois';
import { TAB_BAR_STYLE } from '../_layout';

type Categorie = 'mois_don' | 'evenement' | 'parrain' | 'filleul' | 'fidele';

// Repli quand la carte n'a pas de description saisie dans le BO.
const MESSAGES: Record<Categorie, string> = {
  mois_don: 'Merci pour ton don : cette carte rejoint ta collection.',
  evenement: 'Un souvenir de ta participation à cet événement.',
  parrain: 'Obtenue en parrainant un proche. Merci de faire grandir la communauté !',
  filleul: 'Obtenue en rejoignant Aïma avec un code de parrainage.',
  fidele: 'Obtenue pour ta fidélité au don. Merci de revenir, encore et encore.',
};

/** Attente avant que la carte se retourne (ms). */
const DELAI_RETOURNEMENT = 300;

function trouverCarte(id: number) {
  const cartes = getCartesCache();
  if (!cartes) return undefined;

  // Toutes les collections (années), pas seulement celle de l'année en cours.
  const carteMois = cartes.mois_don.collections
    .flatMap((collection) => collection.cartes)
    .find((carte) => carte.id === id);
  if (carteMois) {
    return {
      categorie: 'mois_don' as Categorie,
      carte: carteMois,
      mois: carteMois.mois_numero,
      annee: carteMois.annee,
    };
  }

  for (const categorieEvenement of cartes.evenement.categories) {
    const carteEvenement = categorieEvenement.cartes.find((carte) => carte.id === id);
    if (carteEvenement) return { categorie: 'evenement' as Categorie, carte: carteEvenement };
  }

  if (cartes.parrainage.carte_parrain.id === id) {
    return {
      categorie: 'parrain' as Categorie,
      carte: cartes.parrainage.carte_parrain,
    };
  }
  if (cartes.parrainage.carte_filleul.id === id) {
    return {
      categorie: 'filleul' as Categorie,
      carte: cartes.parrainage.carte_filleul,
    };
  }
  if (cartes.fidelite?.carte?.id === id) {
    return { categorie: 'fidele' as Categorie, carte: cartes.fidelite.carte };
  }

  return undefined;
}

// 📖 Carte en grand, par-dessus la page (modale transparente, voir _layout), sur un voile
//    aubergine sombre : la carte et ses couleurs ressortent, comme dans une vitrine
//    éclairée. Révélation, sticker et manipulation au doigt : voir CarteRevelee.
//    Toucher le voile ou la croix ferme.
export default function CarteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width, height } = useLargeurApp();
  const resultat = useMemo(() => trouverCarte(Number(id)), [id]);
  const navigation = useNavigation();

  // 📖 La carte s'ouvre dans la pile de l'onglet Cartes, donc sous la barre d'onglets :
  //    on la masque tant que la carte est ouverte, et on la restaure à l'identique après.
  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: TAB_BAR_STYLE });
      };
    }, [navigation])
  );

  // La carte prend le plus de place possible sans déborder, en largeur comme en hauteur.
  const largeur = Math.min(width * 0.72, height * 0.5 * RATIO_CARTE, 320);
  const fermer = () => router.back();

  return (
    // 📖 Racine des gestes posée ici : l’app n’en a pas encore à la racine (_layout).
    <GestureHandlerRootView style={styles.racine}>
      <Animated.View entering={FadeIn.duration(200)} style={styles.voile}>
        <Pressable style={StyleSheet.absoluteFill} onPress={fermer} accessibilityLabel="Fermer" />

        <Pressable
          onPress={fermer}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="Fermer la carte"
          style={({ pressed }) => [styles.fermer, pressed && styles.presse]}
        >
          <Ionicons name="close" size={22} color={Theme.texte.principal} />
        </Pressable>

        {!resultat ? (
          <Text style={[Typo.corps, styles.texte]}>{"Impossible d'afficher cette carte."}</Text>
        ) : (
          <View style={styles.contenu} pointerEvents="box-none">
            <CarteRevelee
              imageUrl={resultat.carte.image_url}
              titre={resultat.carte.titre}
              sticker={
                'mois' in resultat && resultat.mois
                  ? [getNomMois(resultat.mois), resultat.annee].filter(Boolean).join(' ')
                  : nomCourt(resultat.carte.titre)
              }
              largeur={largeur}
              delai={DELAI_RETOURNEMENT}
            />

            <Animated.View
              entering={FadeInDown.delay(DELAI_RETOURNEMENT + DUREE_RETOURNEMENT - 150)
                .duration(300)
                .reduceMotion(ReduceMotion.System)}
              style={styles.legende}
            >
              {/* 📖 Juste la description et la date, en texte discret : un bloc avec fond
                  détournait l'attention de la carte. Le nom est déjà sur le sticker. */}
              <Text style={[Typo.legende, styles.description]}>
                {resultat.carte.description || MESSAGES[resultat.categorie]}
              </Text>
              {!!resultat.carte.obtenue_le && (
                <View style={styles.date}>
                  <Ionicons name="calendar-outline" size={14} color={TEXTE_DISCRET} />
                  <Text style={[Typo.legende, styles.texte]}>
                    Obtenue le {formaterDateLongue(resultat.carte.obtenue_le)}
                  </Text>
                </View>
              )}
              {'quantite' in resultat.carte && !!resultat.carte.quantite && resultat.carte.quantite > 1 && (
                <View style={styles.quantite}>
                  <Ionicons name="copy" size={14} color={Theme.texte.principal} />
                  <Text style={[Typo.legendeForte, styles.quantiteTexte]}>{resultat.carte.quantite} exemplaires</Text>
                </View>
              )}
            </Animated.View>
          </View>
        )}
      </Animated.View>
    </GestureHandlerRootView>
  );
}

// 📖 Sur le voile sombre, texte crème : ≈ 13:1 pour la description, et crème à 75 %
//    (≈ 8:1) pour la date, plus discrète. Le gris habituel serait illisible ici.
const TEXTE_DISCRET = `${Theme.texte.surAccent}BF`;

const styles = StyleSheet.create({
  racine: { flex: 1 },
  voile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Espace[6],
    // Aubergine très sombre à 92 % : la carte ressort, la page reste devinable.
    backgroundColor: 'rgba(30, 16, 23, 0.92)',
  },
  fermer: {
    position: 'absolute',
    top: 54,
    right: Espace[4],
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.fond.surface,
    ...Ombre.flottante,
  },
  presse: { opacity: 0.8 },
  contenu: {
    alignItems: 'center',
    // Place pour le sticker, à cheval sous la carte.
    gap: Espace[12],
  },
  // Texte simple sous la carte, sans fond : la carte reste le seul point d'attention.
  legende: {
    alignItems: 'center',
    gap: Espace[1],
    maxWidth: 300,
  },
  description: {
    color: Theme.texte.surAccent,
    textAlign: 'center',
  },
  date: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[1],
  },
  texte: {
    color: TEXTE_DISCRET,
    textAlign: 'center',
  },
  // Pilule crème : se détache du fond sombre, texte aubergine (≈ 13:1).
  quantite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[1],
    marginTop: Espace[1],
    paddingHorizontal: Espace[3],
    paddingVertical: Espace[1],
    borderRadius: Rayon.plein,
    backgroundColor: Theme.texte.surAccent,
  },
  quantiteTexte: { color: Theme.texte.principal },
});
