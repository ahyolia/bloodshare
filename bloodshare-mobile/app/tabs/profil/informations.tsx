import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useRouter } from "expo-router";
import { Avatar } from "../../../components/ui/Avatar";
import { Bouton } from "../../../components/ui/Bouton";
import { Champ } from "../../../components/ui/Champ";
import { Chargement } from "../../../components/ui/Chargement";
import { EnTeteSousPage } from "../../../components/ui/EnTeteSousPage";
import { EtatErreur } from "../../../components/ui/EtatErreur";
import { entreeSousPage } from "../../../constants/animations";
import { Theme } from "../../../constants/colors";
import { Espace, Ombre, Rayon } from "../../../constants/spacing";
import { Typo } from "../../../constants/typography";
import { AVATARS, avatarParId, getProfil, updateProfil } from "../../../services/profil.service";
import { saveUser, getUser } from "../../../stores/auth.store";
import { useDialogue } from "../../../components/DialogueProvider";
import { CONTENU_MARGE_BASSE } from "../_layout";

const APERCU = 112;
const AVATAR_CHOIX = 56;

export default function InformationsScreen() {
  const router = useRouter();
  const { informer } = useDialogue();

  // 📖 "Controlled input" : la valeur affichée par le TextInput vient TOUJOURS
  //    du state React (value={pseudo}), et chaque frappe passe par
  //    onChangeText={setPseudo}. React est l'unique source de vérité — on peut
  //    valider, tronquer ou formater la saisie avant qu'elle ne s'affiche.
  //    Sans `value`, l'input serait "uncontrolled" : le natif garderait sa
  //    propre valeur, impossible à lire de façon fiable au moment du submit.
  const [pseudo, setPseudo] = useState("");
  const [avatarId, setAvatarId] = useState<number | null>(null);
  const [erreurPseudo, setErreurPseudo] = useState<string | undefined>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  // 📖 On pré-remplit les champs avec les valeurs actuelles : l'utilisateur
  //    modifie un profil existant, il ne le recrée pas. Un formulaire vide
  //    l'obligerait à ressaisir son pseudo pour changer juste l'avatar, et un
  //    envoi accidentel écraserait ses données par du vide.
  const charger = useCallback(() => {
    let cancelled = false;

    getProfil()
      .then((p) => {
        if (cancelled) return;
        setPseudo(p.pseudo);
        setAvatarId(p.avatar_id);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => charger(), [charger]);

  // 📖 Remise à zéro ici et pas dans `charger` : appelée depuis l'effet, elle
  //    déclencherait un rendu en cascade (règle react-hooks du lint).
  const reessayer = () => {
    setLoading(true);
    setError(false);
    charger();
  };

  const enregistrer = async () => {
    if (pseudo.trim().length === 0) {
      setErreurPseudo("Choisis un pseudo pour continuer.");
      return;
    }

    setErreurPseudo(undefined);
    setSaving(true);
    try {
      const frais = await updateProfil({
        pseudo: pseudo.trim(),
        avatar_id: avatarId,
      });

      // 📖 On répercute dans le SecureStore pour que l'écran
      // Profil affiche la nouvelle valeur sans attendre un rechargement.
      const cache = await getUser();
      await saveUser({
        ...(cache ?? {}),
        pseudo: frais.pseudo,
        avatar_id: frais.avatar_id,
        avatar_url: frais.avatar_url,
      });

      router.back();
    } catch (e: unknown) {
      // 📖 Pseudo déjà pris (422) : le message de l'API s'affiche sous le champ,
      //    là où la personne regarde, plutôt que dans une alerte générique.
      const messagePseudo = (e as { response?: { data?: { errors?: { pseudo?: string[] } } } })
        .response?.data?.errors?.pseudo?.[0];
      if (messagePseudo) {
        setErreurPseudo(messagePseudo);
      } else {
        await informer("Erreur", "L'enregistrement a échoué. Réessaie.");
      }
    } finally {
      setSaving(false);
    }
  };

  const avatarChoisi = avatarParId(avatarId);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <EnTeteSousPage titre="Mes informations" />

        {loading && <Chargement message="On récupère tes informations…" />}
        {!loading && error && <EtatErreur onReessayer={reessayer} />}

        {!loading && !error && (
          <>
            {/* APERÇU — l'avatar choisi, tel qu'il apparaît sur le Profil */}
            <Animated.View entering={entreeSousPage} style={styles.apercu}>
              {/* 📖 Exception à « surélevé = interactif » : l'ombre reprend celle du
                  grand avatar du Profil, pour un aperçu fidèle. Posée sur une vue à
                  part : Avatar découpe son cercle (overflow: hidden). */}
              <View style={styles.apercuOmbre}>
                <Avatar avatarId={avatarId} pseudo={pseudo} taille={APERCU} style={styles.apercuAvatar} />
              </View>
            </Animated.View>
            <Text style={[Typo.legende, styles.apercuLegende]}>
              {avatarChoisi ? avatarChoisi.nom : "Aucun avatar choisi"}
            </Text>

            {/* AVATAR */}
            <Animated.View entering={entreeSousPage}>
              <Text style={[Typo.titre3, styles.sectionTitre]} accessibilityRole="header">
                Choisis ton avatar
              </Text>
              <View style={styles.choix}>
                {AVATARS.map((a) => {
                  const actif = a.id === avatarId;
                  return (
                    <Pressable
                      key={a.id}
                      onPress={() => setAvatarId(a.id)}
                      style={[styles.option, actif ? styles.optionActive : styles.optionInactive]}
                      accessibilityRole="button"
                      accessibilityLabel={a.nom}
                      accessibilityState={{ selected: actif }}
                    >
                      <Avatar avatarId={a.id} taille={AVATAR_CHOIX} style={styles.optionFond} />
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* PSEUDO */}
            <Animated.View entering={entreeSousPage} style={styles.champ}>
              <Champ
                libelle="Pseudo"
                aide="C'est le nom qui s'affiche dans l'app. 50 caractères maximum."
                erreur={erreurPseudo}
                value={pseudo}
                onChangeText={(texte) => {
                  setPseudo(texte);
                  if (erreurPseudo) setErreurPseudo(undefined);
                }}
                placeholder="Ton pseudo"
                maxLength={50}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Animated.View>

            <Animated.View entering={entreeSousPage}>
              <Bouton
                variante="validation"
                libelle="Enregistrer"
                icone="checkmark"
                onPress={enregistrer}
                chargement={saving}
                style={styles.enregistrer}
              />
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
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
    paddingBottom: CONTENU_MARGE_BASSE,
  },
  apercu: {
    alignItems: "center",
    paddingVertical: Espace[4],
  },
  apercuOmbre: {
    borderRadius: APERCU / 2,
    ...Ombre.flottante,
  },
  apercuAvatar: {
    borderWidth: 4,
    borderColor: Theme.fond.surface,
    backgroundColor: Theme.fond.surface,
  },
  apercuLegende: {
    color: Theme.texte.secondaire,
    textAlign: "center",
    marginTop: Espace[2],
  },
  sectionTitre: {
    color: Theme.texte.principal,
    marginTop: Espace[6],
    marginBottom: Espace[3],
  },
  // 📖 Grille de 4 par ligne (8 avatars) : en une seule ligne, les cercles
  //    passeraient sous la cible tactile de 48 px sur un petit écran.
  choix: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Espace[3],
    padding: Espace[4],
    borderRadius: Rayon.lg,
    backgroundColor: Theme.fond.surface,
    borderWidth: 1,
    borderColor: Theme.fond.bordure,
  },
  option: {
    borderRadius: Rayon.plein,
    borderWidth: 3,
  },
  // 📖 Sélection = contour aubergine ET agrandissement, pas la couleur seule.
  optionActive: {
    borderColor: Theme.texte.principal,
    transform: [{ scale: 1.08 }],
  },
  optionInactive: {
    borderColor: "transparent",
  },
  optionFond: {
    backgroundColor: Theme.fond.surfaceEnfoncee,
  },
  champ: {
    marginTop: Espace[6],
  },
  enregistrer: {
    marginTop: Espace[8],
  },
});
