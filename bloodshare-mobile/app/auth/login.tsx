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
import { login } from '../../services/auth.service';
import { saveToken, saveUser } from '../../stores/auth.store';

export default function LoginScreen() {
  // États pour les champs de formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // États pour l'UX (Feedback visuel)
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    // 1. Réinitialiser les erreurs et faire une validation basique
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Veuillez remplir tous les champs.');
      return;
    }

    setIsLoading(true);

    try {
      // 2. Appel via la couche service (mock ou API selon USE_MOCK_DATA)
      const { token, user } = await login(email.trim(), password);

      // 3. Sauvegarde sécurisée (attendre que la promesse resolve avant de router)
      await saveToken(token);
      await saveUser(user);

      // 4. Redirection vers les onglets en écrasant la navigation
      router.replace('/tabs');
    } catch (error: any) {
      console.error('Erreur de connexion:', error);

      // 5. Gestion fine de l'erreur pour l'utilisateur
      if (error.response) {
        // Le serveur a répondu avec un code d'erreur (ex: 401)
        if (error.response.status === 401) {
          // On exploite le champ 'message' renvoyé par le backend
          setErrorMessage(error.response.data?.message || 'Email ou mot de passe incorrect.');
        } else {
          setErrorMessage('Une erreur est survenue côté serveur.');
        }
      } else if (error.request) {
        // La requête est partie, mais aucune réponse (problème réseau ou IP incorrecte)
        setErrorMessage('Impossible de joindre le serveur. Vérifiez votre connexion.');
      } else {
        // Erreur de configuration de la requête Axios
        setErrorMessage("Une erreur inattendue s'est produite.");
      }
    } finally {
      setIsLoading(false);
    }
  };

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
        <Text style={styles.title}>Connexion</Text>

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
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={Colors.grisMoyen}
          value={password}
          onChangeText={setPassword}
          secureTextEntry // Masque les caractères
          autoCapitalize="none"
          autoComplete="password"
          editable={!isLoading}
          onSubmitEditing={handleLogin}
          returnKeyType="go"
        />

        {/* Affichage conditionnel du message d'erreur */}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={isLoading}
          accessibilityRole="button"
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.cremeClair} />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.push('/auth/register')} style={styles.linkContainer}>
          <Text style={styles.linkText}>Pas encore de compte ? S&apos;inscrire</Text>
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
    marginBottom: 32,
    textAlign: 'center',
    color: Colors.aubergine,
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
