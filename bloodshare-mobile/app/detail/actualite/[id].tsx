import { useLocalSearchParams } from 'expo-router';
import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { EnTeteContenu } from '../../../components/accueil/EnTeteContenu';
import { EnTeteSousPage } from '../../../components/ui/EnTeteSousPage';
import { TexteDocument } from '../../../components/ui/TexteDocument';
import { entreeSousPage } from '../../../constants/animations';
import { Theme } from '../../../constants/colors';
import { Espace, Rayon } from '../../../constants/spacing';
import { TEINTES_VIVES, type TeintePastille } from '../../../constants/teintes';
import { Typo } from '../../../constants/typography';
import { dateActualiteLongue } from '../../../utils/accueil';
import { tempsLecture } from '../../../utils/tempsLecture';

const TEINTES: TeintePastille[] = ['corail', 'petrole', 'mousse', 'orange'];

export default function ActualiteDetailScreen() {
  // 📖 Params passés par router.push depuis le carrousel de l'accueil. TOUT est
  //    string (sérialisé dans l'URL). En V1 il n'y a pas de GET /actualites/{id} :
  //    on se contente des champs déjà chargés dans la liste, transmis ici.
  //    `teinte` : celle de la carte touchée, pour qu'on retrouve la même couleur.
  const { titre, chapo, contenu, published_at, image_url, teinte } = useLocalSearchParams<{
    id: string;
    titre: string;
    chapo: string;
    contenu: string;
    published_at: string;
    image_url: string;
    teinte?: string;
  }>();
  const couleur = TEINTES.find((t) => t === teinte) ?? 'corail';

  const pilules: ComponentProps<typeof EnTeteContenu>['pilules'] = [
    { icone: 'calendar-outline', texte: dateActualiteLongue(published_at ?? '') },
  ];
  if (contenu) pilules.push({ icone: 'time-outline', texte: `${tempsLecture(contenu)} min de lecture` });

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <EnTeteSousPage titre="Actualité" />

        <Animated.View entering={entreeSousPage} style={styles.corps}>
          <EnTeteContenu
            titre={titre ?? ''}
            teinte={couleur}
            icone="newspaper"
            pilules={pilules}
            imageUrl={image_url || undefined}
          />

          {/* 📖 Le chapeau, comme l'introduction d'une fiche : plus grand, en couleur principale. */}
          {!!chapo && <Text style={styles.chapo}>{chapo}</Text>}

          {contenu ? (
            <TexteDocument contenu={contenu} variante="fiche" accent={TEINTES_VIVES[couleur]} />
          ) : (
            <View style={styles.vide}>
              <Text style={[Typo.corps, styles.secondaire]}>
                Le contenu complet de cette actualité sera bientôt disponible.
              </Text>
            </View>
          )}
        </Animated.View>
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
    paddingBottom: Espace[12],
  },
  corps: {
    gap: Espace[6],
  },
  chapo: {
    ...Typo.corpsFort,
    fontSize: 18,
    lineHeight: 26,
    color: Theme.texte.principal,
  },
  vide: {
    padding: Espace[4],
    borderRadius: Rayon.lg,
    backgroundColor: Theme.fond.surface,
    borderWidth: 1,
    borderColor: Theme.fond.bordure,
  },
  secondaire: { color: Theme.texte.secondaire },
});
