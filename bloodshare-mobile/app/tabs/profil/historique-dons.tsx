import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { CarteChiffre } from '../../../components/ui/CarteChiffre';
import { Chargement } from '../../../components/ui/Chargement';
import { EnTeteSousPage } from '../../../components/ui/EnTeteSousPage';
import { EtatErreur } from '../../../components/ui/EtatErreur';
import { EtatVide } from '../../../components/ui/EtatVide';
import { entreeSousPage } from '../../../constants/animations';
import { Theme } from '../../../constants/colors';
import { accorder } from '../../../utils/pluriel';
import { Espace, Rayon } from '../../../constants/spacing';
import { TEINTES_PASTILLE } from '../../../constants/teintes';
import { Typo } from '../../../constants/typography';
import { Don, DonsReponse, getDons } from '../../../services/dons.service';
import { formaterDateHeureCourte, formaterDateHeureLongue } from '../../../utils/dates';
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
              titre="Ton premier don t’attend"
              message="Scanne le QR code au centre de don ou lors d’une collecte : il apparaîtra ici."
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

/** Trois chiffres clés : nombre de dons, date du dernier, cartes-souvenirs obtenues. */
function Resume({ dons, total }: { dons: Don[]; total: number }) {
  // 📖 GET /dons renvoie les dons du plus récent au plus ancien.
  const dernier = dons[0]?.date_don;
  const cartes = dons.filter((d) => d.carte_obtenue).length;

  return (
    <View style={styles.resume}>
      <CarteChiffre
        icone="water-outline"
        teinte="corail"
        inclinaison="-3deg"
        valeur={String(total)}
        libelle={accorder(total, 'Don')}
      />
      <CarteChiffre
        icone="calendar-outline"
        teinte="petrole"
        inclinaison="2deg"
        valeur={dernier ? formaterDateHeureCourte(dernier) : '–'}
        libelle="Dernier don"
      />
      <CarteChiffre
        icone="albums-outline"
        teinte="mousse"
        inclinaison="-2deg"
        valeur={String(cartes)}
        libelle={accorder(cartes, 'Carte')}
      />
    </View>
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
  resume: {
    flexDirection: 'row',
    gap: Espace[3],
    marginBottom: Espace[2],
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
