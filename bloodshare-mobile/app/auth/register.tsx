import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';

// TODO — Écran d'inscription à implémenter (POST /auth/register, voir docs/contrat_API.md § 1).
// Champs réellement validés par AuthController::register :
//   pseudo (max 50, unique), email (unique), password (min 8, majuscule + minuscule + chiffre)
//   avec password_confirmation, sexe (requis, homme|femme),
//   statut_donneur (optionnel : donneur_regulier|quelques_dons|jamais_donne),
//   avatar_id (optionnel, doit exister en base), code_parrainage (optionnel).
// ⚠️ `sexe` est requis par l'API et stocké côté serveur (la fréquence de don en dépend), mais
// il ne doit jamais être conservé sur le téléphone : la liste blanche de auth.service.ts s'en
// charge, ne pas la contourner ici.
// La réponse 201 renvoie { token, user } comme le login — même traitement, saveToken + saveUser.
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
