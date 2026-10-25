import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Chargement } from '../../components/ui/Chargement';
import { EnTeteSousPage } from '../../components/ui/EnTeteSousPage';
import { EtatErreur } from '../../components/ui/EtatErreur';
import { EtatVide } from '../../components/ui/EtatVide';
import { TexteDocument } from '../../components/ui/TexteDocument';
import { entreeSousPage } from '../../constants/animations';
import { Theme } from '../../constants/colors';
import { Espace } from '../../constants/spacing';
import { Typo } from '../../constants/typography';
import {
  DocumentJuridique,
  getDocumentJuridique,
  TYPES_DOCUMENTS_JURIDIQUES,
  TypeDocumentJuridique,
} from '../../services/documentsJuridiques.service';

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

            <TexteDocument contenu={etat.document.contenu} />
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
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: Espace[12],
  },
  meta: {
    color: Theme.texte.secondaire,
    marginBottom: Espace[4],
  },
});
