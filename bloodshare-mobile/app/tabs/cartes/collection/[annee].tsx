import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { GrilleCartes } from '../../../../components/cartes/GrilleCartes';
import { BarreProgression } from '../../../../components/ui/BarreProgression';
import { Chargement } from '../../../../components/ui/Chargement';
import { EnTeteSousPage } from '../../../../components/ui/EnTeteSousPage';
import { EtatErreur } from '../../../../components/ui/EtatErreur';
import { entreeSousPage } from '../../../../constants/animations';
import { Theme } from '../../../../constants/colors';
import { Espace } from '../../../../constants/spacing';
import { Typo } from '../../../../constants/typography';
import { Cartes, getCartes, getCartesCache } from '../../../../services/cartes.service';
import { getNomMois } from '../../../../utils/mois';
import { compter } from '../../../../utils/pluriel';

// 📖 Une collection de cartes du mois (une année) en entier : les 12 cartes de janvier à
//    décembre. On y arrive depuis un bloc de la page Cartes, qui a déjà chargé les
//    données (cache) ; on ne les recharge que si la page est ouverte directement (web).
export default function CollectionScreen() {
  const { annee } = useLocalSearchParams<{ annee: string }>();
  const router = useRouter();
  const [cartes, setCartes] = useState<Cartes | null>(getCartesCache());
  const [erreur, setErreur] = useState(false);

  const charger = useCallback(() => {
    getCartes()
      .then((data) => {
        setCartes(data);
        setErreur(false);
      })
      .catch(() => setErreur(true));
  }, []);

  useEffect(() => {
    if (!getCartesCache()) charger();
  }, [charger]);

  const collection = cartes?.mois_don.collections.find((c) => c.annee === Number(annee));
  const obtenues = collection?.cartes.filter((carte) => carte.obtenue).length ?? 0;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <EnTeteSousPage titre={`Collection ${annee}`} />

        {!cartes && !erreur && <Chargement message="On ouvre ton classeur…" />}

        {erreur && !cartes && (
          <EtatErreur
            message="Impossible de charger tes cartes. Vérifie ta connexion et réessaie."
            onReessayer={charger}
          />
        )}

        {cartes && !collection && (
          <Text style={[Typo.corps, styles.texte]}>{"Cette collection n'existe pas encore."}</Text>
        )}

        {collection && (
          <Animated.View entering={entreeSousPage} style={styles.contenu}>
            <BarreProgression
              titre={`Collection ${annee}`}
              titreMasque
              fine
              valeur={obtenues}
              max={12}
              detail={`${compter(obtenues, 'carte')} sur 12`}
            />
            <GrilleCartes
              cartes={collection.cartes.map((carte) => ({ ...carte, legende: getNomMois(carte.mois_numero) }))}
              onOuvrir={(id) => router.push({ pathname: '/tabs/cartes/[id]', params: { id } })}
            />
          </Animated.View>
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
    paddingHorizontal: Espace[4],
    paddingTop: 54,
    // La barre d'onglets flotte par-dessus le bas de la page.
    paddingBottom: 126,
  },
  contenu: {
    gap: Espace[6],
  },
  texte: {
    color: Theme.texte.secondaire,
  },
});
