import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { BarreProgression } from '../../../components/ui/BarreProgression';
import { Chargement } from '../../../components/ui/Chargement';
import { EnTeteSousPage } from '../../../components/ui/EnTeteSousPage';
import { EtatErreur } from '../../../components/ui/EtatErreur';
import { EtatVide } from '../../../components/ui/EtatVide';
import { Groupe, Separateur } from '../../../components/ui/Groupe';
import { entreeSousPage } from '../../../constants/animations';
import { Theme } from '../../../constants/colors';
import { accorder, compter } from '../../../utils/pluriel';
import { Espace, Rayon } from '../../../constants/spacing';
import { TEINTES_PASTILLE, type TeintePastille } from '../../../constants/teintes';
import { Typo } from '../../../constants/typography';
import { GainPoints, getPointsHistorique, SourcePoints } from '../../../services/points.service';
import { getProfil, Profil } from '../../../services/profil.service';
import { formaterDateHeureLongue } from '../../../utils/dates';
import { CONTENU_MARGE_BASSE } from '../_layout';

type Icone = ComponentProps<typeof Ionicons>['name'];

// 📖 Métadonnées d'affichage par source. Record<SourcePoints, …> → si un jour on
//    ajoute une source à l'union, le compilateur exige de compléter cette table.
const META_SOURCE: Record<SourcePoints, { icone: Icone; teinte: TeintePastille; libelle: string }> = {
  quiz: { icone: 'school-outline', teinte: 'petrole', libelle: 'Quiz complété' },
  parrainage: { icone: 'people-outline', teinte: 'orange', libelle: 'Parrainage validé' },
};

export default function PointsScreen() {
  const router = useRouter();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [historique, setHistorique] = useState<GainPoints[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const charger = useCallback(() => {
    let cancelled = false;

    // 📖 Deux ressources indépendantes → Promise.all, un seul await.
    Promise.all([getProfil(), getPointsHistorique()])
      .then(([p, h]) => {
        if (cancelled) return;
        setProfil(p);
        setHistorique(h);
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

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <EnTeteSousPage titre="Points et niveau" />

        {loading && <Chargement message="On récupère tes points…" />}
        {!loading && error && <EtatErreur onReessayer={reessayer} />}

        {!loading && !error && profil && historique && (
          <>
            {/* NIVEAU — le bloc vedette (lime) de l'écran */}
            <Animated.View entering={entreeSousPage}>
              <BarreProgression
                variante="surLime"
                titre={`Niveau ${profil.niveau.niveau} — ${profil.niveau.label}`}
                valeur={profil.niveau.progression}
                max={100}
                detail={
                  profil.niveau.points_prochain_niveau !== null
                    ? `${profil.points_cumules}/${profil.niveau.points_prochain_niveau} pts`
                    : 'Niveau max 🎉'
                }
                style={styles.niveau}
              />
            </Animated.View>

            {/* COMMENT GAGNER DES POINTS */}
            <Animated.View entering={entreeSousPage}>
              <Text style={[Typo.titre3, styles.sectionTitre]} accessibilityRole="header">
                Comment gagner des points
              </Text>
              <Groupe variante="info">
                <LigneInfo icone="school-outline" teinte="petrole" texte="Termine un quiz" />
                <Separateur />
                <LigneInfo icone="people-outline" teinte="orange" texte="Parraine un proche" />
              </Groupe>
              {/* 📖 Règle éthique ADSB-NC : le don est gratuit, il ne rapporte jamais de points. */}
              <View style={styles.note}>
                <Ionicons name="heart-outline" size={18} color={Theme.texte.secondaire} />
                <Text style={[Typo.legende, styles.noteTexte]}>
                  Un don de sang ne rapporte jamais de points : c’est un geste gratuit.
                </Text>
              </View>
            </Animated.View>

            {/* HISTORIQUE */}
            <Animated.View entering={entreeSousPage}>
              <Text style={[Typo.titre3, styles.sectionTitre]} accessibilityRole="header">
                Historique
              </Text>
              {historique.length === 0 ? (
                <EtatVide
                  titre="Pas encore de points"
                  message="Termine un quiz ou parraine un proche pour gagner tes premiers points."
                  libelleAction="Découvrir les quiz"
                  onAction={() => router.push('/tabs/quiz')}
                />
              ) : (
                <Groupe variante="info">
                  {historique.map((gain, i) => (
                    <View key={gain.id}>
                      {i > 0 && <Separateur />}
                      <LigneGain gain={gain} />
                    </View>
                  ))}
                </Groupe>
              )}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Pastille({ icone, teinte }: { icone: Icone; teinte: TeintePastille }) {
  const couleurs = TEINTES_PASTILLE[teinte];
  return (
    <View style={[styles.pastille, { backgroundColor: couleurs.fond }]}>
      <Ionicons name={icone} size={20} color={couleurs.icone} />
    </View>
  );
}

function LigneInfo({ icone, teinte, texte }: { icone: Icone; teinte: TeintePastille; texte: string }) {
  return (
    <View style={styles.ligne}>
      <Pastille icone={icone} teinte={teinte} />
      <Text style={[Typo.corpsFort, styles.ligneTexte]}>{texte}</Text>
    </View>
  );
}

function LigneGain({ gain }: { gain: GainPoints }) {
  const meta = META_SOURCE[gain.source];
  const date = formaterDateHeureLongue(gain.date);

  return (
    <View style={styles.ligne} accessible accessibilityLabel={`${meta.libelle}, ${date}, plus ${compter(gain.points, 'point')}`}>
      <Pastille icone={meta.icone} teinte={meta.teinte} />
      <View style={styles.ligneTextes}>
        <Text style={[Typo.corpsFort, { color: Theme.texte.principal }]}>{meta.libelle}</Text>
        <Text style={[Typo.legende, { color: Theme.texte.secondaire }]}>{date}</Text>
      </View>
      <View style={styles.gain}>
        <Text style={[Typo.legendeForte, { color: Theme.accent.signatureTexte }]}>+{gain.points} {accorder(gain.points, 'pt')}</Text>
      </View>
    </View>
  );
}

const PASTILLE = 40;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.fond.page,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: CONTENU_MARGE_BASSE,
  },
  // 📖 Bloc lime plus aéré que la variante par défaut : c'est la vedette de l'écran.
  niveau: {
    paddingHorizontal: Espace[6],
    paddingVertical: Espace[6],
    gap: Espace[4],
  },
  sectionTitre: {
    color: Theme.texte.principal,
    marginTop: Espace[6],
    marginBottom: Espace[3],
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[3],
    minHeight: 68,
    paddingHorizontal: Espace[4],
    paddingVertical: Espace[3],
  },
  pastille: {
    width: PASTILLE,
    height: PASTILLE,
    borderRadius: Rayon.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ligneTexte: {
    flex: 1,
    color: Theme.texte.principal,
  },
  ligneTextes: {
    flex: 1,
    gap: 2,
  },
  // 📖 Même aplat lime que la pastille de points de l'en-tête.
  gain: {
    paddingHorizontal: Espace[3],
    paddingVertical: Espace[1],
    borderRadius: Rayon.plein,
    backgroundColor: Theme.accent.signatureAplat,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Espace[2],
    marginTop: Espace[3],
    paddingHorizontal: Espace[1],
  },
  noteTexte: {
    flex: 1,
    color: Theme.texte.secondaire,
  },
});
