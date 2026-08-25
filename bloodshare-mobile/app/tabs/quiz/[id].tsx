import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../constants/colors';

export default function QuizDeroulementScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.text}>Déroulement du quiz — à construire</Text>
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
