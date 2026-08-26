import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';

// TODO — Écran d'inscription à implémenter (POST /auth/register, voir docs/contrat_API.md § 1).
// Champs attendus : pseudo, email, password, password_confirmation, sexe, groupe_sanguin,
// avatar_id, code_parrainage (optionnel). La réponse renvoie { token, user } comme le login.
export default function RegisterScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Créer un compte</Text>
      <Text style={styles.text}>Écran à construire.</Text>

      <Pressable onPress={() => router.back()} style={styles.linkContainer}>
        <Text style={styles.linkText}>Retour à la connexion</Text>
      </Pressable>
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
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.aubergine,
    marginBottom: 8,
  },
  text: {
    color: Colors.grisMoyen,
    fontSize: 14,
    textAlign: 'center',
  },
  linkContainer: {
    marginTop: 24,
  },
  linkText: {
    color: Colors.petrole[600],
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
