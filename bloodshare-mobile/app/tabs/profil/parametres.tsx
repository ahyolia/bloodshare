import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, type ComponentProps } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Bouton } from "../../../components/ui/Bouton";
import { ElementListe } from "../../../components/ui/ElementListe";
import { EnTeteSousPage } from "../../../components/ui/EnTeteSousPage";
import { Groupe, Separateur } from "../../../components/ui/Groupe";
import { entreeSousPage } from "../../../constants/animations";
import { Theme } from "../../../constants/colors";
import { Palette } from "../../../constants/palette";
import { Espace, Rayon } from "../../../constants/spacing";
import { TEINTES_PASTILLE, type TeintePastille } from "../../../constants/teintes";
import { Typo } from "../../../constants/typography";
import {
  subscribe as sAbonnerNotifsWeb,
  unsubscribe as seDesabonnerNotifsWeb,
} from "../../../services/notifications/webPush";
import { supprimerCompte } from "../../../services/profil.service";
import { removeToken } from "../../../stores/auth.store";
import {
  getNotificationsActivees,
  getPenurieActivee,
  setNotificationsActivees,
  setPenurieActivee,
} from "../../../utils/preferences";
import { useDialogue } from "../../../components/DialogueProvider";
import { CONTENU_MARGE_BASSE } from "../_layout";

// 📖 expo-notifications ne fonctionne plus dans Expo Go (SDK 53+) et son simple
//    import y jette une erreur. On le charge donc en `require()` paresseux, à
//    l'intérieur d'un try/catch, et seulement hors Expo Go. En Expo Go on se
//    contente d'enregistrer la préférence : la vraie demande de permission se
//    fera sur un build de développement.
const EST_EXPO_GO = Constants.executionEnvironment === "storeClient";

async function demanderPermissionNotifs(): Promise<boolean> {
  if (EST_EXPO_GO) return true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require("expo-notifications");
    const { status } = await Notifications.getPermissionsAsync();
    if (status === "granted") return true;
    const demande = await Notifications.requestPermissionsAsync();
    return demande.status === "granted";
  } catch {
    // Module indisponible (Expo Go) → on ne bloque pas l'utilisateur.
    return true;
  }
}

// 📖 AsyncStorage vs SecureStore pour les préférences :
//    - SecureStore chiffre chaque valeur (keychain iOS / keystore Android).
//      Indispensable pour un secret (token d'auth), mais lent et limité en
//      taille. Un vol du téléphone ne révèle pas la valeur.
//    - AsyncStorage est un simple key/value en clair sur le disque de l'app.
//      Rapide, sans quota gênant. Parfait pour des réglages d'affichage non
//      sensibles : si quelqu'un lit "notifications = true", aucun risque.
//    → Les deux toggles ci-dessous vont dans AsyncStorage (via utils/preferences).
export default function ParametresScreen() {
  const router = useRouter();
  const { confirmer, informer } = useDialogue();
  const [notifs, setNotifs] = useState(false);
  const [penurie, setPenurie] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getNotificationsActivees(), getPenurieActivee()]).then(
      ([n, p]) => {
        if (cancelled) return;
        setNotifs(n);
        setPenurie(p);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // 📖 Les notifications push exigent une permission explicite de l'OS : recevoir
  //    des alertes est intrusif (son, bandeau, badge) et l'utilisateur doit
  //    pouvoir refuser. Activer le toggle ne suffit donc pas — on demande la
  //    permission système ; si elle est refusée, on remet le toggle à OFF.
  const basculerNotifs = async (valeur: boolean) => {
    if (valeur) {
      const accorde = await demanderPermissionNotifs();
      if (!accorde) {
        await informer(
          "Permission refusée",
          "Active les notifications pour Aïma dans les réglages de ton téléphone.",
        );
        setNotifs(false);
        await setNotificationsActivees(false);
        return;
      }

      // 📖 No-op côté natif (Expo Push repoussé en V2) : seule la version web
      //    (PWA) s'abonne réellement au Web Push ici — voir webPush.web.ts.
      let abonne = false;
      try {
        abonne = await sAbonnerNotifsWeb();
      } catch {
        abonne = false;
      }
      if (!abonne) {
        await informer(
          "Permission refusée",
          "Active les notifications pour Aïma dans les réglages de ton navigateur.",
        );
        setNotifs(false);
        await setNotificationsActivees(false);
        return;
      }
    } else {
      try {
        await seDesabonnerNotifsWeb();
      } catch {
        // 📖 Le désabonnement est une opération de confort (évite de recevoir des
        //    push inutiles) : son échec ne doit pas bloquer la désactivation du
        //    toggle localement.
      }
    }
    setNotifs(valeur);
    await setNotificationsActivees(valeur);
  };

  const basculerPenurie = async (valeur: boolean) => {
    setPenurie(valeur);
    await setPenurieActivee(valeur);
  };

  // 📖 Double confirmation : la suppression est irréversible. Une première modale
  //    explique, une seconde force un choix volontaire. Avec `await`, les deux
  //    étapes se lisent de haut en bas au lieu d'être imbriquées dans des onPress.
  const supprimer = async () => {
    const etape1 = await confirmer({
      titre: "Supprimer mon compte",
      message: "Cette action est irréversible. Toutes tes données seront supprimées.",
      libelleRester: "Garder mon compte",
      libelleAction: "Continuer",
    });
    if (!etape1) return;

    const etape2 = await confirmer({
      titre: "Dernière confirmation",
      message: "Veux-tu vraiment tout supprimer ?",
      libelleRester: "Garder mon compte",
      libelleAction: "Supprimer définitivement",
    });
    if (!etape2) return;

    try {
      await supprimerCompte();
    } catch {
      await informer("Erreur", "La suppression a échoué. Réessaie.");
      return;
    }

    // 📖 À partir d'ici, le compte n'existe plus côté serveur : on ne doit plus jamais
    //    afficher d'échec. On nettoie au mieux, puis on renvoie au login quoi qu'il arrive.
    try {
      await removeToken();
    } catch {
      // Le token est de toute façon invalide côté serveur : au prochain appel, l'API
      // renverra 401 et l'intercepteur de services/api.ts le supprimera.
    }
    await informer(
      "Compte supprimé",
      "Ton compte et tes données ont bien été supprimés.",
    );
    router.replace("/auth/login");
  };

  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <EnTeteSousPage titre="Paramètres" />

        {/* COMPTE */}
        <Animated.View entering={entreeSousPage}>
          <Text style={[Typo.titre3, styles.sectionTitre]} accessibilityRole="header">
            Compte
          </Text>
          <Groupe>
            <ElementListe
              icone="person-outline"
              teinte="corail"
              titre="Modifier mes informations"
              sousTitre="Pseudo et avatar"
              onPress={() => router.push("/tabs/profil/informations")}
            />
            <Separateur />
            <ElementListe
              icone="key-outline"
              titre="Changer mon mot de passe"
              onPress={() => router.push("/changer-mot-de-passe")}
            />
            <Separateur />
            <ElementListe
              icone="help-circle-outline"
              titre="Mot de passe oublié"
              onPress={() => router.push("/auth/mot-de-passe-oublie")}
            />
          </Groupe>
        </Animated.View>

        {/* NOTIFICATIONS */}
        <Animated.View entering={entreeSousPage}>
          <Text style={[Typo.titre3, styles.sectionTitre]} accessibilityRole="header">
            Notifications
          </Text>
          <Groupe>
            <LigneInterrupteur
              icone="notifications-outline"
              teinte="petrole"
              titre="Notifications push"
              sousTitre="Rappels et nouveautés"
              valeur={notifs}
              onChange={basculerNotifs}
            />
            <Separateur />
            <LigneInterrupteur
              icone="water-outline"
              teinte="corail"
              titre="Alertes pénurie de sang"
              sousTitre="Quand les réserves sont basses"
              valeur={penurie}
              onChange={basculerPenurie}
            />
          </Groupe>
        </Animated.View>

        {/* À PROPOS */}
        <Animated.View entering={entreeSousPage}>
          <Text style={[Typo.titre3, styles.sectionTitre]} accessibilityRole="header">
            À propos
          </Text>
          <Groupe>
            <ElementListe
              icone="shield-checkmark-outline"
              teinte="mousse"
              titre="Politique de confidentialité"
              onPress={() => router.push("/documents/confidentialite")}
            />
            <Separateur />
            <ElementListe
              icone="document-text-outline"
              teinte="mousse"
              titre="Conditions d'utilisation"
              onPress={() => router.push("/documents/cgu")}
            />
            <Separateur />
            <ElementListe
              icone="information-circle-outline"
              teinte="mousse"
              titre="Mentions légales"
              onPress={() => router.push("/documents/mentions_legales")}
            />
          </Groupe>
          {/* 📖 Hors de la carte : une info, pas une ligne qui se touche (surélevé = interactif). */}
          <Text style={[Typo.legende, styles.version]}>Aïma · version {version}</Text>
        </Animated.View>

        {/* ZONE DANGEREUSE */}
        <Animated.View entering={entreeSousPage}>
          <Text style={[Typo.titre3, styles.sectionTitre]} accessibilityRole="header">
            Zone dangereuse
          </Text>
          <Text style={[Typo.legende, styles.avertissement]}>
            La suppression est définitive : ton pseudo, tes points, tes badges et tes cartes disparaissent.
          </Text>
          {/* 📖 Variante `destructif` : toujours derrière une confirmation (ici, double). */}
          <Bouton
            libelle="Supprimer mon compte"
            icone="trash-outline"
            variante="destructif"
            onPress={supprimer}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

type Icone = ComponentProps<typeof Ionicons>["name"];

function Pastille({ icone, teinte }: { icone: Icone; teinte: TeintePastille }) {
  const couleurs = TEINTES_PASTILLE[teinte];
  return (
    <View style={[styles.pastille, { backgroundColor: couleurs.fond }]}>
      <Ionicons name={icone} size={20} color={couleurs.icone} />
    </View>
  );
}

/** Ligne de réglage on/off, même gabarit qu'ElementListe (pastille, titre, sous-titre). */
function LigneInterrupteur({
  icone,
  teinte,
  titre,
  sousTitre,
  valeur,
  onChange,
}: {
  icone: Icone;
  teinte: TeintePastille;
  titre: string;
  sousTitre: string;
  valeur: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.ligne}>
      <Pastille icone={icone} teinte={teinte} />
      <View style={styles.ligneTextes}>
        <Text style={[Typo.corpsFort, { color: Theme.texte.principal }]}>{titre}</Text>
        <Text style={[Typo.legende, { color: Theme.texte.secondaire }]}>{sousTitre}</Text>
      </View>
      <Switch
        value={valeur}
        onValueChange={onChange}
        accessibilityLabel={titre}
        // 📖 Pétrole un peu transparent : l'état « activé » reste lisible sans
        //    la lourdeur de l'aubergine.
        trackColor={{ true: COULEUR_ACTIVE, false: Theme.fond.bordure }}
        thumbColor={Theme.fond.surface}
      />
    </View>
  );
}

const PASTILLE = 40;
// 📖 Pétrole 500 à 70 % d'opacité (suffixe hexadécimal B3).
const COULEUR_ACTIVE = `${Palette.petrole[500]}B3`;

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
  sectionTitre: {
    color: Theme.texte.principal,
    marginTop: Espace[6],
    marginBottom: Espace[3],
  },
  ligne: {
    flexDirection: "row",
    alignItems: "center",
    gap: Espace[3],
    minHeight: 68,
    paddingHorizontal: Espace[4],
    paddingVertical: Espace[3],
  },
  pastille: {
    width: PASTILLE,
    height: PASTILLE,
    borderRadius: Rayon.md,
    alignItems: "center",
    justifyContent: "center",
  },
  version: {
    color: Theme.texte.secondaire,
    textAlign: "center",
    marginTop: Espace[3],
  },
  ligneTextes: {
    flex: 1,
    gap: 2,
  },
  avertissement: {
    color: Theme.texte.secondaire,
    marginBottom: Espace[3],
  },
});
