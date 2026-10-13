import { Linking, ScrollView, StyleSheet, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';

const EMAIL_CONTACT = 'aima.dondusang@outlook.fr';

// 📖 Pas d'envoi de mail automatique en V1 : cet écran n'appelle pas l'API, il explique
//    la procédure manuelle. L'utilisateur écrit depuis l'adresse de son compte (même
//    procédure que dans les CGU), ce qui permet à l'admin de vérifier que la demande
//    vient bien du titulaire du compte. Le reset se fait dans le backoffice (action
//    "Réinitialiser le mot de passe" sur la fiche utilisateur), et l'admin répond avec
//    un mot de passe temporaire.
export default function MotDePasseOublieScreen() {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Mot de passe oublié</Text>
      <Text style={styles.subtitle}>
        {'Écrivez à '}
        <Text
          style={styles.email}
          onPress={() => Linking.openURL(`mailto:${EMAIL_CONTACT}`)}
          accessibilityRole="link"
        >
          {EMAIL_CONTACT}
        </Text>
        {" depuis l'adresse email de votre compte pour demander une réinitialisation. " +
          "Un membre de l'équipe vous communiquera un mot de passe temporaire, que vous " +
          'devrez changer à votre prochaine connexion.'}
      </Text>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => router.replace('/auth/login')}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Retour à la connexion</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 54,
    backgroundColor: Colors.creme,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    color: Colors.aubergine,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.grisMoyen,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 28,
  },
  email: {
    color: Colors.aubergine,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  button: {
    height: 56,
    borderRadius: 20,
    backgroundColor: Colors.aubergine,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: Colors.cremeClair,
    fontSize: 17,
    fontWeight: '700',
  },
});
