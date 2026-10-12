import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import {
  DocumentJuridique,
  getDocumentJuridique,
  TYPES_DOCUMENTS_JURIDIQUES,
  TypeDocumentJuridique,
} from '../../services/documentsJuridiques.service';
import { decouperDocument } from '../../utils/documentTexte';

type Etat =
  | { statut: 'chargement' }
  | { statut: 'pret'; document: DocumentJuridique }
  | { statut: 'absent' }
  | { statut: 'erreur' };

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

  useEffect(() => {
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

  // 📖 Ouvert depuis un lien direct (PWA), il n'y a pas d'écran précédent.
  const retour = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={retour} style={styles.backButton} accessibilityRole="button">
          <Ionicons name="arrow-back" size={20} color={Colors.aubergine} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
      </View>

      {etat.statut === 'chargement' ? (
        <ActivityIndicator style={styles.chargement} color={Colors.aubergine} />
      ) : etat.statut === 'pret' ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.titre}>{etat.document.titre}</Text>
          <Text style={styles.meta}>
            Version {etat.document.version} · mise à jour le {formatDate(etat.document.mis_a_jour_le)}
          </Text>

          {decouperDocument(etat.document.contenu).map((bloc, index) =>
            bloc.type === 'titre' ? (
              <Text key={index} style={styles.sousTitre} accessibilityRole="header">
                {bloc.texte}
              </Text>
            ) : bloc.type === 'liste' ? (
              <View key={index} style={styles.liste}>
                {bloc.items.map((item, i) => (
                  <View key={i} style={styles.puceLigne}>
                    <Text style={styles.paragraphe}>•</Text>
                    <Text style={[styles.paragraphe, styles.puceTexte]}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text key={index} style={styles.paragraphe}>
                {bloc.texte}
              </Text>
            )
          )}
        </ScrollView>
      ) : (
        <View style={styles.content}>
          <Text style={styles.vide}>
            {etat.statut === 'absent'
              ? 'Ce document sera bientôt disponible.'
              : 'Impossible de charger ce document. Vérifiez votre connexion et réessayez.'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: Colors.aubergine,
    fontSize: 14,
    marginLeft: 4,
  },
  chargement: {
    marginTop: 40,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  titre: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.aubergine,
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    color: Colors.grisMoyen,
    marginBottom: 16,
  },
  sousTitre: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.aubergine,
    marginTop: 16,
    marginBottom: 8,
  },
  paragraphe: {
    fontSize: 15,
    color: Colors.grisMoyen,
    lineHeight: 22,
    marginBottom: 8,
  },
  liste: {
    marginBottom: 8,
  },
  puceLigne: {
    flexDirection: 'row',
  },
  puceTexte: {
    flex: 1,
    marginLeft: 8,
    marginBottom: 4,
  },
  vide: {
    fontSize: 15,
    color: Colors.grisMoyen,
    fontStyle: 'italic',
  },
});
