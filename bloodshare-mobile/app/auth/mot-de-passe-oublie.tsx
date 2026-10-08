import { ScrollView, StyleSheet, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';

// 📖 Pas d'envoi de mail en V1 (l'association n'a pas encore de mail dédié,
//    voir CLAUDE.md) : cet écran n'appelle plus l'API, il explique juste la
//    procédure manuelle. Le reset lui-même se fait côté admin dans le
//    backoffice (action "Réinitialiser le mot de passe" sur la fiche
//    utilisateur), qui transmet un mot de passe temporaire à l'utilisateur.
export default function MotDePasseOublieScreen() {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Mot de passe oublié</Text>
      <Text style={styles.subtitle}>
        Contactez l&apos;association BloodShare (réseaux sociaux ou de vive voix) pour
        demander une réinitialisation. Un membre de l&apos;équipe vous communiquera un
        mot de passe temporaire, que vous pourrez changer dès votre prochaine connexion.
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
