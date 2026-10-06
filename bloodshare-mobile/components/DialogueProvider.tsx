import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "../constants/colors";

type Options = {
  titre: string;
  message: string;
  libelleOk: string;
  libelleAnnuler?: string;
  destructif?: boolean;
};

type DialogueApi = {
  confirmer: (
    titre: string,
    message: string,
    libelleOk: string,
    destructif?: boolean,
  ) => Promise<boolean>;
  informer: (titre: string, message: string) => Promise<void>;
};

const DialogueContext = createContext<DialogueApi | null>(null);

export function DialogueProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<Options | null>(null);
  // 📖 On garde de côté la fonction qui « répond » à la promesse en attente :
  //    elle sera appelée quand l'utilisateur cliquera sur un bouton.
  const resolveRef = useRef<((resultat: boolean) => void) | null>(null);

  const ouvrir = useCallback(
    (o: Options) =>
      new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setOptions(o);
      }),
    [],
  );

  const fermer = (resultat: boolean) => {
    resolveRef.current?.(resultat);
    resolveRef.current = null;
    setOptions(null);
  };

  const api = useMemo<DialogueApi>(
    () => ({
      confirmer: (titre, message, libelleOk, destructif = true) =>
        ouvrir({
          titre,
          message,
          libelleOk,
          libelleAnnuler: "Annuler",
          destructif,
        }),
      informer: async (titre, message) => {
        await ouvrir({ titre, message, libelleOk: "OK" });
      },
    }),
    [ouvrir],
  );

  return (
    <DialogueContext.Provider value={api}>
      {children}

      <Modal
        visible={options !== null}
        transparent
        animationType="fade"
        onRequestClose={() => fermer(false)} // bouton retour Android
      >
        <View style={styles.fond}>
          <View style={styles.carte} accessibilityViewIsModal>
            <Text style={styles.titre} accessibilityRole="header">
              {options?.titre}
            </Text>
            <Text style={styles.message}>{options?.message}</Text>

            <View style={styles.boutons}>
              {options?.libelleAnnuler && (
                <Pressable
                  style={[styles.bouton, styles.boutonSecondaire]}
                  onPress={() => fermer(false)}
                  accessibilityRole="button"
                >
                  <Text style={styles.texteSecondaire}>
                    {options.libelleAnnuler}
                  </Text>
                </Pressable>
              )}
              <Pressable
                style={[
                  styles.bouton,
                  options?.destructif
                    ? styles.boutonDestructif
                    : styles.boutonPrincipal,
                ]}
                onPress={() => fermer(true)}
                accessibilityRole="button"
              >
                <Text style={styles.textePrincipal}>{options?.libelleOk}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </DialogueContext.Provider>
  );
}

export function useDialogue() {
  const ctx = useContext(DialogueContext);
  if (!ctx)
    throw new Error(
      "useDialogue doit être utilisé à l’intérieur de DialogueProvider",
    );
  return ctx;
}

const styles = StyleSheet.create({
  fond: {
    flex: 1,
    backgroundColor: "rgba(62, 36, 48, 0.45)", // aubergine translucide, pas de noir
    justifyContent: "center",
    padding: 24,
  },
  carte: {
    backgroundColor: Colors.blanc,
    borderRadius: 20,
    padding: 24,
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  titre: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.aubergine,
  },
  message: {
    fontSize: 16,
    color: Colors.aubergine,
    marginTop: 8,
    lineHeight: 22,
  },
  boutons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  bouton: {
    flex: 1,
    minHeight: 48, // cible tactile WCAG
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  boutonSecondaire: {
    borderWidth: 1.5,
    borderColor: Colors.aubergine,
  },
  boutonPrincipal: {
    backgroundColor: Colors.petrole[500],
  },
  boutonDestructif: {
    backgroundColor: Colors.corail[600],
  },
  texteSecondaire: {
    color: Colors.aubergine,
    fontWeight: "700",
    fontSize: 15,
  },
  textePrincipal: {
    color: Colors.blanc,
    fontWeight: "700",
    fontSize: 15,
  },
});
