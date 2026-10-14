import { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Theme } from '../constants/colors';
import { Espace, Ombre, Rayon } from '../constants/spacing';
import { Typo } from '../constants/typography';
import { Bouton } from './ui/Bouton';

/**
 * Modales de l'app (Figma : Retours & états › ConfirmModal).
 *
 * 📖 Règle du Figma : le choix qui garde la personne en sécurité est le bouton
 *    PRIMAIRE (« Garder mon compte »), l'action qui fait sortir ou perdre quelque
 *    chose est en DISCRET. Un appui réflexe tombe ainsi sur le choix sûr.
 * 📖 `confirmer` renvoie `true` si la personne choisit l'ACTION.
 */
type OptionsConfirmation = {
  titre: string;
  message: string;
  /** Le choix sûr, en bouton primaire (ex. « Garder mon compte »). */
  libelleRester: string;
  /** L'action qui fait sortir ou perdre quelque chose, en bouton discret. */
  libelleAction: string;
};

type Ouverte = {
  titre: string;
  message: string;
  libelleAction: string;
  libelleRester?: string;
};

type DialogueApi = {
  confirmer: (options: OptionsConfirmation) => Promise<boolean>;
  informer: (titre: string, message: string) => Promise<void>;
};

const DialogueContext = createContext<DialogueApi | null>(null);

export function DialogueProvider({ children }: { children: ReactNode }) {
  const [ouverte, setOuverte] = useState<Ouverte | null>(null);
  // 📖 On garde de côté la fonction qui « répond » à la promesse en attente :
  //    elle sera appelée quand la personne choisira un bouton.
  const resolveRef = useRef<((resultat: boolean) => void) | null>(null);

  const ouvrir = useCallback(
    (o: Ouverte) =>
      new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setOuverte(o);
      }),
    [],
  );

  const fermer = (resultat: boolean) => {
    resolveRef.current?.(resultat);
    resolveRef.current = null;
    setOuverte(null);
  };

  const api = useMemo<DialogueApi>(
    () => ({
      confirmer: (options) => ouvrir(options),
      informer: async (titre, message) => {
        await ouvrir({ titre, message, libelleAction: 'OK' });
      },
    }),
    [ouvrir],
  );

  const estConfirmation = ouverte?.libelleRester !== undefined;

  return (
    <DialogueContext.Provider value={api}>
      {children}

      <Modal
        visible={ouverte !== null}
        transparent
        animationType="fade"
        // 📖 Bouton retour Android, et touche Échap sur web : on choisit le côté sûr.
        onRequestClose={() => fermer(false)}
      >
        <View style={styles.fond}>
          <View style={styles.carte} accessibilityViewIsModal>
            <Text style={[Typo.titre3, styles.titre]} accessibilityRole="header">
              {ouverte?.titre}
            </Text>
            <Text style={[Typo.corps, styles.message]}>{ouverte?.message}</Text>

            {estConfirmation ? (
              <>
                <Bouton libelle={ouverte!.libelleRester!} onPress={() => fermer(false)} />
                <Bouton libelle={ouverte!.libelleAction} variante="discret" onPress={() => fermer(true)} />
              </>
            ) : (
              <Bouton libelle={ouverte?.libelleAction ?? 'OK'} onPress={() => fermer(true)} />
            )}
          </View>
        </View>
      </Modal>
    </DialogueContext.Provider>
  );
}

export function useDialogue() {
  const ctx = useContext(DialogueContext);
  if (!ctx) throw new Error('useDialogue doit être utilisé à l’intérieur de DialogueProvider');
  return ctx;
}

const styles = StyleSheet.create({
  fond: {
    flex: 1,
    backgroundColor: 'rgba(62, 36, 48, 0.45)', // aubergine translucide, pas de noir
    justifyContent: 'center',
    padding: Espace[6],
  },
  carte: {
    ...Ombre.modale,
    backgroundColor: Theme.fond.surface,
    borderRadius: Rayon.lg,
    padding: Espace[6],
    gap: Espace[4],
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  titre: { color: Theme.texte.principal },
  message: { color: Theme.texte.secondaire },
});