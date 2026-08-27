import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { forgotPassword } from '../../services/auth.service';

export default function MotDePasseOublieScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [envoye, setEnvoye] = useState(false);

  const handleSubmit = async () => {
    setErrorMessage('');
    if (!email) {
      setErrorMessage('Veuillez saisir votre adresse e-mail.');
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword(email.trim());
      setEnvoye(true);
    } catch (error: any) {
      console.error('Erreur lors de la demande de réinitialisation:', error);

      if (error.response) {
        setErrorMessage(error.response.data?.message || 'Une erreur est survenue côté serveur.');
      } else if (error.request) {
        setErrorMessage('Impossible de joindre le serveur. Vérifiez votre connexion.');
      } else {
        setErrorMessage("Une erreur inattendue s'est produite.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (envoye) {
    return (
      <KeyboardAvoidingView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>E-mail envoyé</Text>
          <Text style={styles.subtitle}>
            Si un compte est associé à {email.trim()}, vous recevrez un lien de réinitialisation
            dans quelques minutes. Pensez à vérifier vos spams.
          </Text>

          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={() => router.replace('/auth/login')}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Retour à la connexion</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Mot de passe oublié</Text>
        <Text style={styles.subtitle}>
          Saisissez l&apos;adresse e-mail de votre compte : nous vous enverrons un lien pour
          définir un nouveau mot de passe.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Adresse e-mail"
          placeholderTextColor={Colors.grisMoyen}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          editable={!isLoading}
          onSubmitEditing={handleSubmit}
          returnKeyType="send"
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
          accessibilityRole="button"
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.cremeClair} />
          ) : (
            <Text style={styles.buttonText}>Envoyer le lien</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.linkContainer}>
          <Text style={styles.linkText}>Retour à la connexion</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.creme,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 54,
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
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: '#D8D3CA',
    paddingHorizontal: 16,
    borderRadius: 18,
    marginBottom: 16,
    fontSize: 15,
    color: Colors.aubergine,
    backgroundColor: Colors.cremeClair,
  },
  errorText: {
    color: Colors.corail[600],
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
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
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.cremeClair,
    fontSize: 17,
    fontWeight: '700',
  },
  linkContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: Colors.petrole[600],
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
