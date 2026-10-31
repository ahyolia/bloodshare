import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { Theme } from '../../constants/colors';
import { Espace, Rayon } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import { BlocDocument, decouperDocument, decouperGras } from '../../utils/documentTexte';

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

/**
 * Texte long saisi dans le backoffice (documents juridiques, fiches pratiques), découpé
 * par `decouperDocument` : « ## Titre », « - » pour une puce, « **gras** ».
 *
 * 📖 Un seul bloc blanc pour tout le texte : le fond clair aide à lire, sans le poids
 *    d'une carte par section. Les sections se séparent par un filet, et leur titre en
 *    pétrole se distingue des intitulés en gras du texte.
 * 📖 Variante `fiche` (texte à lire, pas un contrat) : l'introduction sort du bloc et
 *    devient un chapeau plus grand ; le texte passe en couleur principale pour le
 *    contraste ; les titres de section, en aubergine, sont marqués d'un trait de la
 *    couleur `accent` (celle de la catégorie), reprise par les puces.
 */
type Props = {
  contenu: string;
  variante?: 'document' | 'fiche';
  /** Couleur du trait des titres et des puces (variante `fiche`). */
  accent?: string;
};

export function TexteDocument({ contenu, variante = 'document', accent = Theme.info.icone }: Props) {
  const fiche = variante === 'fiche';
  const sections = enSections(decouperDocument(contenu));
  // Fiche : le texte avant le premier titre devient le chapeau, hors du bloc blanc.
  const intro = fiche && sections[0]?.titre === null ? sections[0] : null;
  const corps = intro ? sections.slice(1) : sections;

  return (
    <View style={styles.conteneur}>
      {intro?.blocs.map((bloc, j) =>
        bloc.type === 'paragraphe' ? <TexteRiche key={j} texte={bloc.texte} style={styles.chapeau} /> : null,
      )}

      {corps.length > 0 && (
        <View style={styles.document}>
          {corps.map((section, i) => (
            <View key={i} style={[styles.section, i > 0 && styles.sectionSuivante]}>
              {section.titre && (
                <View style={fiche && styles.titreLigne}>
                  {fiche && <View style={[styles.trait, { backgroundColor: accent }]} />}
                  <Text
                    style={[Typo.titre3, fiche ? styles.sectionTitreFiche : styles.sectionTitre]}
                    accessibilityRole="header"
                  >
                    {section.titre}
                  </Text>
                </View>
              )}
              {section.blocs.map((bloc, j) =>
                bloc.type === 'liste' ? (
                  <View key={j} style={styles.liste}>
                    {bloc.items.map((item, k) => (
                      <View key={k} style={styles.puceLigne}>
                        <View style={[styles.puce, fiche && { backgroundColor: accent }]} />
                        <TexteRiche texte={item} style={[styles.puceTexte, fiche && styles.texteFonce]} />
                      </View>
                    ))}
                  </View>
                ) : bloc.type === 'paragraphe' ? (
                  <TexteRiche key={j} texte={bloc.texte} style={fiche && styles.texteFonce} />
                ) : null,
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/** Paragraphe ou puce, avec ses passages « **en gras** » mis en avant. */
function TexteRiche({ texte, style }: { texte: string; style?: StyleProp<TextStyle> }) {
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
  conteneur: {
    gap: Espace[4],
  },
  // Chapeau d'une fiche : plus grand et foncé, il donne l'essentiel avant le détail.
  chapeau: {
    fontSize: 17,
    lineHeight: 26,
    color: Theme.texte.principal,
  },
  texteFonce: {
    color: Theme.texte.principal,
  },
  titreLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espace[2],
  },
  trait: {
    width: 4,
    height: 20,
    borderRadius: Rayon.plein,
  },
  sectionTitreFiche: {
    flex: 1,
    color: Theme.texte.principal,
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
