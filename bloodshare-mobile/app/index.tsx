import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../constants/colors';

export default function Splash() {
  return (
    <View
      style={styles.page}
      accessible
      accessibilityLabel="Aïma, le don du sang en Nouvelle-Calédonie. Chargement en cours."
    >
      <Text style={styles.nom}>Aïma</Text>
      <Text style={styles.accroche}>
        Le don du sang en Nouvelle-Calédonie, chaleureux et ludique.
      </Text>
      <ActivityIndicator color={Theme.texte.secondaire} style={styles.chargement} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Theme.fond.page,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  nom: {
    color: Theme.texte.principal,
    fontSize: 48,
    fontWeight: '700',
  },
  accroche: {
    color: Theme.texte.secondaire,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  chargement: {
    marginTop: 24,
  },
});