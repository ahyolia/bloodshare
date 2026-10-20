import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Chargement } from '../../components/ui/Chargement';
import { EnTeteSousPage } from '../../components/ui/EnTeteSousPage';
import { EtatErreur } from '../../components/ui/EtatErreur';
import { EtatVide } from '../../components/ui/EtatVide';
import { entreeSousPage } from '../../constants/animations';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import {
  DocumentJuridique,
  getDocumentJuridique,
  TYPES_DOCUMENTS_JURIDIQUES,
  TypeDocumentJuridique,
} from '../../services/documentsJuridiques.service';
import { BlocDocument, decouperDocument, decouperGras } from '../../utils/documentTexte';

type Etat =
  | { statut: 'chargement' }
  | { statut: 'pret'; document: DocumentJuridique }
  | { statut: 'absent' }
  | { statut: 'erreur' };

/** Titre affiché tant que le document n'est pas chargé (ou s'il n'existe pas). */
const TITRES: Record<TypeDocumentJuridique, string> = {
  cgu: "Conditions d'utilisation",
  confidentialite: 'Politique de confidentialité',
  mentions_legales: 'Mentions légales',
};

/** Une section = un titre « ## » et les blocs qui le suivent, jusqu'au titre suivant. */
type Section = { titre: string | null; blocs: BlocDocument[] };

const enSections = (blocs: BlocDocument[]): Section[] =>
  blocs.reduce<Section[]>((sections, bloc) => {
    if (bloc.type === 'titre') return [...sections, { titre: bloc.texte, blocs: [] }];
    // 📖 Du texte avant le premier titre forme une introduction, sans titre.
    if (!sections.length) return [{ titre: null, blocs: [bloc] }];
    sections[sections.length - 1].blocs.push(bloc);
    return sections;
  }, []);

// 📖 "2026-10-14" → "14 octobre 2026". timeZone UTC : pas de décalage selon l'appareil.
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

// 📖 Écran public (groupe `documents`, voir utils/destination.ts) : il doit s'ouvrir
//    depuis l'inscription, avant toute connexion, comme depuis les paramètres du profil.
export default function DocumentJuridiqueScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();
  const [etatChargement, setEtat] = useState<Etat>({ statut: 'chargement' });
  const typeValide = TYPES_DOCUMENTS_JURIDIQUES.includes(type as TypeDocumentJuridique);
  const etat: Etat = typeValide ? etatChargement : { statut: 'absent' };

  const charger = useCallback(() => {
    if (!typeValide) return;

    let annule = false;
    getDocumentJuridique(type as TypeDocumentJuridique)
      .then((document) => {
        if (!annule) setEtat(document ? { statut: 'pret', document } : { statut: 'absent' });
      })
      .catch(() => {
        if (!annule) setEtat({ statut: 'erreur' });
      });

    return () => {
      annule = true;
    };
  }, [type, typeValide]);

  useEffect(() => charger(), [charger]);

  const reessayer = () => {
    setEtat({ statut: 'chargement' });
    charger();
  };

  // 📖 Ouvert depuis un lien direct (PWA), il n'y a pas d'écran précédent.
  const retour = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const titre =
    etat.statut === 'pret'
      ? etat.document.titre
      : (TITRES[type as TypeDocumentJuridique] ?? 'Document');

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <EnTeteSousPage titre={titre} onRetour={retour} />

        {etat.statut === 'chargement' && <Chargement message="On récupère le document…" />}

        {etat.statut === 'erreur' && (
          <EtatErreur
            message="Impossible de charger ce document. Vérifie ta connexion et réessaie."
            onReessayer={reessayer}
          />
        )}

        {etat.statut === 'absent' && (
          <EtatVide titre="Bientôt disponible" message="Ce document est en cours de rédaction." />
        )}

        {etat.statut === 'pret' && (
          <Animated.View entering={entreeSousPage}>
            <Text style={[Typo.legende, styles.meta]}>
              Version {etat.document.version} · mise à jour le {formatDate(etat.document.mis_a_jour_le)}
            </Text>

            {/* 📖 Un seul bloc blanc pour tout le texte : le fond clair aide à lire, sans
                le poids d'une carte par section. Les sections se séparent par un filet,
                et leur titre en pétrole se distingue des intitulés en gras du texte. */}
            <View style={styles.document}>
              {enSections(decouperDocument(etat.document.contenu)).map((section, i) => (
                <View key={i} style={[styles.section, i > 0 && styles.sectionSuivante]}>
                  {section.titre && (
                    <Text style={[Typo.titre3, styles.sectionTitre]} accessibilityRole="header">
                      {section.titre}
                    </Text>
                  )}
                  {section.blocs.map((bloc, j) =>
                    bloc.type === 'liste' ? (
                      <View key={j} style={styles.liste}>
                        {bloc.items.map((item, k) => (
                          <View key={k} style={styles.puceLigne}>
                            <View style={styles.puce} />
                            <TexteRiche texte={item} style={styles.puceTexte} />
                          </View>
                        ))}
                      </View>
                    ) : bloc.type === 'paragraphe' ? (
                      <TexteRiche key={j} texte={bloc.texte} />
                    ) : null,
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

/** Paragraphe ou puce, avec ses passages « **en gras** » mis en avant. */
function TexteRiche({ texte, style }: { texte: string; style?: object }) {
  return (
    <Text style={[Typo.corps, styles.paragraphe, style]}>
      {decouperGras(texte).map((segment, i) =>
        segment.gras ? (
          <Text key={i} style={styles.gras}>
            {segment.texte}
          </Text>
        ) : (
          segment.texte
        ),
      )}
    </Text>
  );
}

const PUCE = 6;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.fond.page,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: Espace[12],
  },
  meta: {
    color: Theme.texte.secondaire,
    marginBottom: Espace[4],
  },
  document: {
    padding: Espace[6] - Espace[1],
    borderRadius: Rayon.lg,
    borderWidth: 1,
    borderColor: Theme.fond.bordure,
    backgroundColor: Theme.fond.surface,
  },
  section: {
    gap: Espace[3],
  },
  sectionSuivante: {
    marginTop: Espace[6],
    paddingTop: Espace[6],
    borderTopWidth: 1,
    borderTopColor: Theme.fond.bordure,
  },
  // 📖 Pétrole (6,1:1 sur la surface) : le titre de section ne se confond pas avec
  //    les intitulés en gras du texte, eux en aubergine.
  sectionTitre: {
    color: Theme.info.icone,
  },
  paragraphe: {
    color: Theme.texte.secondaire,
  },
  // 📖 Le gras passe aussi en couleur principale : il ressort deux fois, par la
  //    graisse et par le contraste.
  gras: {
    ...Typo.corpsFort,
    color: Theme.texte.principal,
  },
  liste: {
    gap: Espace[2],
  },
  puceLigne: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Espace[3],
  },
  // 📖 Centrée sur la 1re ligne de texte (lineHeight 24).
  puce: {
    width: PUCE,
    height: PUCE,
    borderRadius: PUCE / 2,
    marginTop: (24 - PUCE) / 2,
    backgroundColor: Theme.info.icone,
  },
  puceTexte: {
    flex: 1,
  },
});
