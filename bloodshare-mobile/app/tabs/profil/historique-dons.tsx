import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Chargement } from '../../../components/ui/Chargement';
import { EnTeteSousPage } from '../../../components/ui/EnTeteSousPage';
import { EtatErreur } from '../../../components/ui/EtatErreur';
import { EtatVide } from '../../../components/ui/EtatVide';
import { entreeSousPage } from '../../../constants/animations';
import { Theme } from '../../../constants/colors';
import { Palette } from '../../../constants/palette';
import { compter } from '../../../utils/pluriel';
import { Espace, Rayon } from '../../../constants/spacing';
import { TEINTES_PASTILLE } from '../../../constants/teintes';
import { Typo } from '../../../constants/typography';
import { Don, DonsReponse, getDons } from '../../../services/dons.service';
import { formaterDateHeureLongue } from '../../../utils/dates';
import { CONTENU_MARGE_BASSE } from '../_layout';

// 📖 FlatList vs ScrollView :
//    - ScrollView monte TOUS ses enfants d'un coup → parfait pour un contenu
//      court et fini (un formulaire, une fiche). Au-delà de quelques dizaines
//      d'éléments, la mémoire et le temps de montage explosent.
//    - FlatList est "virtualisée" : elle ne rend que les lignes visibles (+ un
//      petit tampon) et recycle les vues en défilant. C'est le bon choix pour
//      une liste potentiellement longue et dont on ne connaît pas la taille,
//      comme l'historique des dons. Elle gère aussi nativement keyExtractor,
//      séparateurs, pull-to-refresh et l'état vide (ListEmptyComponent).
export default function HistoriqueDonsScreen() {
  const router = useRouter();
  const [data, setData] = useState<DonsReponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const charger = useCallback(() => {
    let cancelled = false;

    getDons()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => charger(), [charger]);

  // 📖 Remise à zéro ici et pas dans `charger` : appelée depuis l'effet, elle
  //    déclencherait un rendu en cascade (règle react-hooks du lint).
  const reessayer = () => {
    setLoading(true);
    setError(false);
    charger();
  };

  const total = data?.total_dons ?? 0;

  return (
    <View style={styles.screen}>
      <FlatList
        data={!loading && !error && data ? data.dons : []}
        keyExtractor={(don) => String(don.id)}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={EspaceListe}
        ListHeaderComponent={
          <>
            <EnTeteSousPage titre="Historique des dons" />

            {loading && <Chargement message="On récupère tes dons…" />}
            {!loading && error && <EtatErreur onReessayer={reessayer} />}

            {!loading && !error && data && data.dons.length > 0 && (
              <>
                <Resume dons={data.dons} total={total} />
                <Animated.Text
                  entering={entreeSousPage}
                  style={[Typo.titre3, styles.sectionTitre]}
                  accessibilityRole="header"
                >
                  Tous mes dons
                </Animated.Text>
              </>
            )}
          </>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={entreeSousPage}>
            <CarteDon don={item} />
          </Animated.View>
        )}
        ListEmptyComponent={
          !loading && !error && data ? (
            <EtatVide
              titre="Ton premier don t'attend"
              message="Scanne le QR code au centre de don ou lors d'une collecte : il apparaîtra ici."
              libelleAction="Aller au don"
              onAction={() => router.push('/tabs/don')}
            />
          ) : null
        }
      />
    </View>
  );
}

function EspaceListe() {
  return <View style={styles.espaceListe} />;
}

/**
 * Le remerciement, mis en avant : voile aubergine à 12 % (l'aplat plein était trop lourd),
 * titre aubergine 900 (9,9:1), phrase aubergine 500 (4,8:1), goutte corail 700 (4,5:1).
 * Le pétrole pâle essayé avant manquait de lisibilité.
 * 📖 Pas de blocs de chiffres ici : ils reprenaient ceux de la page Profil et
 *    brouillaient la hiérarchie entre les deux pages.
 * 📖 Contrastes sur l'aubergine : texte crème ≈ 13:1, goutte lime 8,98:1.
 */
function Resume({ dons, total }: { dons: Don[]; total: number }) {
  // 📖 GET /dons renvoie les dons du plus récent au plus ancien : le premier est le dernier de la liste.
  const premier = dons[dons.length - 1]?.date_don;

  return (
    <Animated.View entering={entreeSousPage} style={styles.merci}>
      <Ionicons name="water" size={22} color={Palette.corail[700]} />
      <View style={styles.merciTextes}>
        <Text style={[Typo.corpsFort, styles.merciTitre]}>
          {total > 1 ? `Merci pour tes ${compter(total, 'don')} ♡` : 'Merci pour ton don ❤️'}
        </Text>
        {premier && (
          <Text style={[Typo.legende, styles.merciTexte]}>
            {`Depuis le ${formaterDateHeureLongue(premier)}, chacun d'eux compte.`}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

function CarteDon({ don }: { don: Don }) {
  const estEvenement = don.type === 'evenement';
  const teinte = TEINTES_PASTILLE[estEvenement ? 'petrole' : 'corail'];
  const date = formaterDateHeureLongue(don.date_don);
  const lieu = estEvenement ? 'Événement' : 'Centre de don';
  const carte = don.carte_obtenue ? `Carte « ${don.carte_obtenue.titre} »` : 'Pas de carte associée';

  return (
    <View style={styles.carte} accessible accessibilityLabel={`Don du ${date}, ${lieu}, ${carte}`}>
      <View style={[styles.pastille, { backgroundColor: teinte.fond }]}>
        <Ionicons name={estEvenement ? 'calendar-outline' : 'water-outline'} size={20} color={teinte.icone} />
      </View>

      <View style={styles.textes}>
        <Text style={[Typo.corpsFort, { color: Theme.texte.principal }]}>{date}</Text>
        <Text style={[Typo.legende, { color: Theme.texte.secondaire }]} numberOfLines={1}>
          {carte}
        </Text>
      </View>

      {/* 📖 Le lieu est écrit en toutes lettres : la couleur de la pastille ne le porte pas seule. */}
      <View style={[styles.etiquette, { backgroundColor: teinte.fond }]}>
        <Text style={[Typo.legendeForte, { color: Theme.texte.principal }]}>
          {estEvenement ? 'Événement' : 'Centre'}
        </Text>
      </View>
    </View>
  );
}

const PASTILLE = 44;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.fond.page,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: CONTENU_MARGE_BASSE,
    flexGrow: 1,
  },
  merci: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[3],
    padding: Espace[4],
    borderRadius: Rayon.lg,
    // Aubergine à 12 % d'opacité (suffixe hexadécimal 1F).
    backgroundColor: `${Theme.texte.principal}1F`,
  },
  merciTextes: {
    flex: 1,
    gap: 2,
  },
  merciTitre: {
    color: Theme.texte.principal,
  },
  merciTexte: {
    color: Theme.texte.secondaire,
  },
  sectionTitre: {
    color: Theme.texte.principal,
    marginTop: Espace[6],
    marginBottom: Espace[3],
  },
  espaceListe: {
    height: Espace[3],
  },
  carte: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[3],
    padding: Espace[4],
    borderRadius: Rayon.lg,
    // 📖 À plat : un don se consulte, il ne s'ouvre pas (surélevé = interactif).
    backgroundColor: Theme.fond.surface,
    borderWidth: 1,
    borderColor: Theme.fond.bordure,
  },
  pastille: {
    width: PASTILLE,
    height: PASTILLE,
    borderRadius: Rayon.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textes: {
    flex: 1,
    gap: 2,
  },
  etiquette: {
    paddingHorizontal: Espace[3],
    paddingVertical: Espace[1],
    borderRadius: Rayon.plein,
  },
});
