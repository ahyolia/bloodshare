import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';

export default function AccueilScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.text}>Accueil — à construire</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.creme,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    color: Colors.aubergine,
    fontSize: 16,
    textAlign: 'center',
  },
});
