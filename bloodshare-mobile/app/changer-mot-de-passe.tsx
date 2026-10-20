import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { router, useLocalSearchParams } from "expo-router";
import { useDialogue } from "../components/DialogueProvider";
import { Bouton } from "../components/ui/Bouton";
import { Champ } from "../components/ui/Champ";
import { EnTeteSousPage } from "../components/ui/EnTeteSousPage";
import { entreeSousPage } from "../constants/animations";
import { Theme } from "../constants/colors";
import { Espace, Rayon } from "../constants/spacing";
import { Typo } from "../constants/typography";
import { changerMotDePasse } from "../services/auth.service";
import { getUser, saveUser } from "../stores/auth.store";
import { motDePasseValide, REGLE_MOT_DE_PASSE } from "../utils/motDePasse";

type Erreurs = { actuel?: string; nouveau?: string; confirmation?: string; generale?: string };

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
  const [enCours, setEnCours] = useState(false);
  const [erreurs, setErreurs] = useState<Erreurs>({});

  // 📖 Chaque erreur s'affiche sous son champ, et s'efface dès qu'on le corrige.
  const saisir = (champ: keyof Erreurs, setter: (v: string) => void) => (valeur: string) => {
    setter(valeur);
    if (erreurs[champ] || erreurs.generale) setErreurs((e) => ({ ...e, [champ]: undefined, generale: undefined }));
  };

  const valider = async () => {
    const locales: Erreurs = {
      actuel: motDePasseActuel ? undefined : "Saisis ton mot de passe actuel.",
      nouveau: !motDePasse
        ? "Choisis un nouveau mot de passe."
        : motDePasseValide(motDePasse)
          ? undefined
          : REGLE_MOT_DE_PASSE,
      confirmation: !confirmation
        ? "Confirme ton nouveau mot de passe."
        : confirmation !== motDePasse
          ? "Les deux mots de passe ne correspondent pas."
          : undefined,
    };
    if (locales.actuel || locales.nouveau || locales.confirmation) {
      setErreurs(locales);
      return;
    }

    setEnCours(true);
    try {
      await changerMotDePasse(motDePasseActuel, motDePasse, confirmation);

      // 📖 Le cache local du user doit refléter `doit_changer_mdp = false`,
      //    sinon le garde de app/_layout.tsx nous renverrait aussitôt ici.
      const cache = await getUser();
      await saveUser({ ...(cache ?? {}), doit_changer_mdp: false });

      await informer("Mot de passe modifié", "Ton mot de passe a bien été mis à jour.");
      router.replace("/tabs");
    } catch (error: any) {
      if (error.response?.status === 422) {
        // 📖 L'API renvoie l'erreur par champ : « mot_de_passe_actuel » ou « password ».
        const champs = error.response.data?.errors ?? {};
        setErreurs({
          actuel: champs.mot_de_passe_actuel?.[0],
          nouveau: champs.password?.[0],
          generale:
            champs.mot_de_passe_actuel || champs.password
              ? undefined
              : error.response.data?.message || "Mot de passe actuel incorrect ou nouveau mot de passe invalide.",
        });
      } else if (error.request) {
        setErreurs({ generale: "Impossible de joindre le serveur. Vérifie ta connexion." });
      } else {
        setErreurs({ generale: "Une erreur inattendue s'est produite." });
      }
    } finally {
      setEnCours(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {oblige ? (
          // 📖 Changement imposé : pas de retour possible, le titre seul.
          <Text style={[Typo.titre2, styles.titre]} accessibilityRole="header">
            Choisis un nouveau mot de passe
          </Text>
        ) : (
          <EnTeteSousPage titre="Changer mon mot de passe" />
        )}

        <Animated.View entering={entreeSousPage} style={styles.formulaire}>
          {oblige && (
            <View style={styles.note}>
              <Ionicons name="information-circle-outline" size={20} color={Theme.info.icone} />
              <Text style={[Typo.legende, styles.noteTexte]}>
                {"Ton mot de passe a été réinitialisé par l'association. Choisis-en un nouveau pour continuer."}
              </Text>
            </View>
          )}

          <Champ
            libelle={oblige ? "Mot de passe temporaire" : "Mot de passe actuel"}
            aide={oblige ? "Celui que l'association t'a envoyé par email." : undefined}
            erreur={erreurs.actuel}
            value={motDePasseActuel}
            onChangeText={saisir("actuel", setMotDePasseActuel)}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            editable={!enCours}
          />
          <Champ
            libelle="Nouveau mot de passe"
            aide={REGLE_MOT_DE_PASSE}
            erreur={erreurs.nouveau}
            value={motDePasse}
            onChangeText={saisir("nouveau", setMotDePasse)}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            editable={!enCours}
          />
          <Champ
            libelle="Confirme le nouveau mot de passe"
            erreur={erreurs.confirmation}
            value={confirmation}
            onChangeText={saisir("confirmation", setConfirmation)}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            editable={!enCours}
            onSubmitEditing={valider}
            returnKeyType="go"
          />

          {erreurs.generale && (
            <View style={styles.erreur} accessibilityLiveRegion="polite">
              <Ionicons name="alert-circle-outline" size={18} color={Theme.feedback.erreurTexte} />
              <Text style={[Typo.legendeForte, styles.erreurTexte]}>{erreurs.generale}</Text>
            </View>
          )}

          <Bouton
            variante="validation"
            libelle="Enregistrer"
            icone="checkmark"
            onPress={valider}
            chargement={enCours}
            style={styles.bouton}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Theme.fond.page,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: Espace[12],
  },
  titre: {
    color: Theme.texte.principal,
    marginBottom: Espace[6],
  },
  formulaire: {
    gap: Espace[6] - Espace[1],
  },
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espace[3],
    padding: Espace[4],
    borderRadius: Rayon.lg,
    backgroundColor: Theme.info.fond,
  },
  noteTexte: {
    flex: 1,
    color: Theme.texte.principal,
  },
  erreur: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Espace[2],
  },
  erreurTexte: {
    flex: 1,
    color: Theme.feedback.erreurTexte,
  },
  bouton: {
    marginTop: Espace[2],
  },
});
