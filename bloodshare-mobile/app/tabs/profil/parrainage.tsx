import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Bouton } from '../../../components/ui/Bouton';
import { Chargement } from '../../../components/ui/Chargement';
import { EnTeteSousPage } from '../../../components/ui/EnTeteSousPage';
import { EtatErreur } from '../../../components/ui/EtatErreur';
import { entreeSousPage } from '../../../constants/animations';
import { Theme } from '../../../constants/colors';
import { accorder } from '../../../utils/pluriel';
import { TEINTES_PASTILLE } from '../../../constants/teintes';
import { Espace, Rayon } from '../../../constants/spacing';
import { Police, Typo } from '../../../constants/typography';
import { getProfil, Profil } from '../../../services/profil.service';
import { CONTENU_MARGE_BASSE } from '../_layout';

// 📖 Share.share() ouvre la feuille de partage NATIVE du système (iOS / Android) :
//    l'utilisateur choisit lui-même l'app de destination (SMS, WhatsApp, mail…).
//    On ne gère aucune intégration tierce, l'OS s'occupe de tout. La promesse
//    résout avec { action } : 'sharedAction' si l'utilisateur a partagé,
//    'dismissedAction' s'il a annulé (iOS uniquement).
export default function ParrainageScreen() {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const charger = useCallback(() => {
    let cancelled = false;

    getProfil()
      .then((p) => {
        if (!cancelled) setProfil(p);
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

  const partager = async () => {
    if (!profil) return;
    try {
      await Share.share({
        message:
          `Rejoins Aïma et donne ton sang ! 🩸\n` +
          `Utilise mon code de parrainage : ${profil.code_parrainage}\n` +
          `https://aima.nc`,
      });
    } catch {
      // 📖 Partage annulé ou indisponible : rien à signaler à l'utilisateur.
    }
  };

  const filleuls = profil?.nb_parrainages_valides ?? 0;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <EnTeteSousPage titre="Parrainage" />

        {loading && <Chargement message="On récupère ton code…" />}
        {!loading && error && <EtatErreur onReessayer={reessayer} />}

        {!loading && !error && profil && (
          <>
            <Animated.View entering={entreeSousPage}>
              <Text style={[Typo.titre3, styles.sectionTitre]} accessibilityRole="header">
                Invite tes potes à rejoindre Aïma
              </Text>
            </Animated.View>

            {/* CODE — le bloc vedette de l'écran : aubergine, code en lime */}
            <Animated.View entering={entreeSousPage} style={styles.code}>
              <Text style={[Typo.legendeForte, styles.codeLibelle]}>Ton code de parrainage</Text>
              <Text
                style={styles.codeTexte}
                selectable
                // 📖 Épelé caractère par caractère : lu d'un bloc, « XYZ98765 » est inaudible.
                accessibilityLabel={`Code ${profil.code_parrainage.split('').join(' ')}`}
              >
                {profil.code_parrainage}
              </Text>
              <Bouton
                libelle="Partager mon code"
                icone="share-social-outline"
                variante="secondaire"
                onPress={partager}
                style={styles.partager}
              />
            </Animated.View>

            {/* 📖 Le mode d'emploi en petite note sous le code : il éclaire sans
                alourdir le haut de page. */}
            <Animated.View entering={entreeSousPage} style={styles.consigne}>
              <Ionicons name="information-circle-outline" size={18} color={Theme.texte.secondaire} />
              <Text style={[Typo.legende, styles.consigneTexte]}>
                {"Ils saisissent ton code à l'inscription. Le parrainage est validé à leur premier don."}
              </Text>
            </Animated.View>

            {/* 📖 Un seul chiffre : une ligne compacte suffit, une carte entière
                prenait beaucoup de place pour peu d'information. À plat : elle informe. */}
            <Animated.View entering={entreeSousPage} style={styles.filleuls}>
              <View style={styles.filleulsPastille}>
                <Ionicons name="people-outline" size={20} color={TEINTES_PASTILLE.orange.icone} />
              </View>
              <Text style={[Typo.corps, styles.filleulsTexte]}>
                <Text style={Typo.corpsFort}>{filleuls}</Text>
                {` ${accorder(filleuls, 'parrainage validé')}`}
              </Text>
            </Animated.View>

            {/* ANONYMAT */}
            <Animated.View entering={entreeSousPage} style={styles.note}>
              <View style={styles.notePastille}>
                <Ionicons name="lock-closed-outline" size={18} color={Theme.info.icone} />
              </View>
              <Text style={[Typo.legende, styles.noteTexte]}>
                {"Par respect de la vie privée, l'identité de tes filleuls n'est jamais affichée."}
              </Text>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

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
  sectionTitre: {
    color: Theme.texte.principal,
    marginBottom: Espace[3],
  },
  // 📖 Même petite note que « Un don ne rapporte jamais de points » (Points et niveau).
  consigne: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Espace[2],
    marginTop: Espace[3],
    paddingHorizontal: Espace[1],
  },
  consigneTexte: {
    flex: 1,
    color: Theme.texte.secondaire,
  },
  code: {
    alignItems: 'center',
    gap: Espace[3],
    padding: Espace[6],
    borderRadius: Rayon.lg,
    backgroundColor: Theme.texte.principal, // aubergine
  },
  codeLibelle: {
    color: Theme.texte.surAccent,
  },
  codeTexte: {
    fontFamily: Police.corpsGras,
    fontSize: 34,
    lineHeight: 44,
    letterSpacing: 6,
    // 📖 Lime sur aubergine : 8,98:1, largement au-dessus du 4,5:1 exigé.
    color: Theme.accent.signatureAplat,
  },
  partager: {
    alignSelf: 'stretch',
  },
  filleuls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[3],
    marginTop: Espace[6],
    paddingVertical: Espace[3],
    paddingHorizontal: Espace[4],
    borderRadius: Rayon.lg,
    borderWidth: 1,
    borderColor: Theme.fond.bordure,
    backgroundColor: Theme.fond.surface,
  },
  filleulsPastille: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TEINTES_PASTILLE.orange.fond,
  },
  filleulsTexte: {
    flex: 1,
    color: Theme.texte.principal,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[3],
    marginTop: Espace[6],
    padding: Espace[4],
    borderRadius: Rayon.lg,
    backgroundColor: Theme.info.fond,
  },
  notePastille: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.fond.surface,
  },
  noteTexte: {
    flex: 1,
    color: Theme.texte.principal,
  },
});
