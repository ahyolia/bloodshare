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
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { login } from '../../services/auth.service';
import { saveToken, saveUser } from '../../stores/auth.store';

export default function LoginScreen() {
  // 📖 `session=expiree` : posé par services/api.ts quand un appel renvoie 401 avec un
  //    token (expiré au bout de 90 jours, ou révoqué).
  const { session } = useLocalSearchParams<{ session?: string }>();

  // États pour les champs de formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // États pour l'UX
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Remplis tous les champs.');
      return;
    }

    setIsLoading(true);

    try {
      const { token, user } = await login(email.trim(), password);

      await saveToken(token);
      await saveUser(user);

      router.replace('/tabs');
    } catch (error: any) {
      // 📖 Jamais l'objet d'erreur entier : il contient la requête envoyée, donc l'email
      //    et le mot de passe en clair (audit RGPD). Le statut suffit pour déboguer.
      if (__DEV__) console.warn('[auth] connexion échouée :', error.response?.status ?? error.message);

      if (error.response) {
        // 📖 403 : compte suspendu, le message vient de l'API.
        if (error.response.status === 401 || error.response.status === 403) {
          setErrorMessage(error.response.data?.message || 'Email ou mot de passe incorrect.');
        } else {
          setErrorMessage('Une erreur est survenue côté serveur.');
        }
      } else if (error.request) {
        setErrorMessage('Impossible de joindre le serveur. Vérifie ta connexion.');
      } else {
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
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          editable={!isLoading}
          onSubmitEditing={handleLogin}
          returnKeyType="go"
        />

        {/* Affichage conditionnel du message d'erreur */}
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : session === 'expiree' ? (
          <Text style={styles.errorText}>Ta session a expiré. Reconnecte-toi.</Text>
        ) : null}

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

        <Pressable
          onPress={() => router.push('/auth/mot-de-passe-oublie')}
          style={styles.linkContainer}
        >
          <Text style={styles.linkText}>Mot de passe oublié ?</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/auth/register')} style={styles.linkContainerSecond}>
          <Text style={styles.linkText}>{"Pas encore de compte ? S'inscrire"}</Text>
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
    minHeight: 52,
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
    minHeight: 56,
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
  linkContainerSecond: {
    marginTop: 14,
    alignItems: 'center',
  },
  linkText: {
    color: Colors.petrole[600],
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
