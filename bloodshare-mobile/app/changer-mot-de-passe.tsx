import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "../constants/colors";
import { changerMotDePasse } from "../services/auth.service";
import { getUser, saveUser } from "../stores/auth.store";
import { useDialogue } from "../components/DialogueProvider";

// 📖 Un seul écran pour les deux cas d'usage : changement volontaire (depuis
//    Paramètres, `force` absent → bouton retour visible) et changement forcé
//    après un reset admin (`doit_changer_mdp`, voir app/_layout.tsx → pas de
//    retour possible, on doit valider pour continuer).
export default function ChangerMotDePasseScreen() {
  const { force } = useLocalSearchParams<{ force?: string }>();
  const oblige = force === "1";
  const { informer } = useDialogue();

  const [motDePasseActuel, setMotDePasseActuel] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async () => {
    setErrorMessage("");

    if (!motDePasseActuel || !motDePasse || !confirmation) {
      setErrorMessage("Veuillez remplir tous les champs.");
      return;
    }
    if (motDePasse !== confirmation) {
      setErrorMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);
    try {
      await changerMotDePasse(motDePasseActuel, motDePasse, confirmation);

      // 📖 Le cache local du user doit refléter `doit_changer_mdp = false`,
      //    sinon le garde de app/_layout.tsx nous renverrait aussitôt ici.
      const cache = await getUser();
      await saveUser({ ...(cache ?? {}), doit_changer_mdp: false });

      await informer("Mot de passe modifié", "Votre mot de passe a bien été mis à jour.");
      router.replace("/tabs");
    } catch (error: any) {
      if (error.response?.status === 422) {
        setErrorMessage(
          error.response.data?.message || "Mot de passe actuel incorrect ou nouveau mot de passe invalide."
        );
      } else if (error.request) {
        setErrorMessage("Impossible de joindre le serveur. Vérifiez votre connexion.");
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
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!oblige && (
          <TouchableOpacity onPress={() => router.back()} accessibilityRole="button">
            <Text style={styles.retour}>← Retour</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.title}>Changer mon mot de passe</Text>
        {oblige && (
          <Text style={styles.subtitle}>
            Votre mot de passe a été réinitialisé par l&apos;association. Choisissez-en
            un nouveau pour continuer.
          </Text>
        )}

        <TextInput
          style={styles.input}
          placeholder="Mot de passe actuel (ou temporaire)"
          placeholderTextColor={Colors.grisMoyen}
          value={motDePasseActuel}
          onChangeText={setMotDePasseActuel}
          secureTextEntry
          autoCapitalize="none"
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Nouveau mot de passe"
          placeholderTextColor={Colors.grisMoyen}
          value={motDePasse}
          onChangeText={setMotDePasse}
          secureTextEntry
          autoCapitalize="none"
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmer le nouveau mot de passe"
          placeholderTextColor={Colors.grisMoyen}
          value={confirmation}
          onChangeText={setConfirmation}
          secureTextEntry
          autoCapitalize="none"
          editable={!isLoading}
          onSubmitEditing={handleSubmit}
          returnKeyType="go"
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
          accessibilityRole="button"
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.cremeClair} />
          ) : (
            <Text style={styles.buttonText}>Valider</Text>
          )}
        </TouchableOpacity>
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
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 54,
  },
  retour: {
    fontSize: 15,
    color: Colors.petrole[500],
    fontWeight: "600",
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    color: Colors.aubergine,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.grisMoyen,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: "#D8D3CA",
    paddingHorizontal: 16,
    borderRadius: 18,
    marginTop: 16,
    fontSize: 15,
    color: Colors.aubergine,
    backgroundColor: Colors.cremeClair,
  },
  errorText: {
    color: Colors.corail[600],
    marginTop: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  button: {
    height: 56,
    borderRadius: 20,
    backgroundColor: Colors.aubergine,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.cremeClair,
    fontSize: 17,
    fontWeight: "700",
  },
});
