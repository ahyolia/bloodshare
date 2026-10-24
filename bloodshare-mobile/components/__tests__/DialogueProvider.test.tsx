import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Bouton } from '../ui/Bouton';
import { DialogueProvider, useDialogue } from '../DialogueProvider';

// 📖 Le premier rendu de la modale, à froid, a dépassé les 5 s par défaut sur la machine de
//    CI (6,7 s) alors qu'il passe en local : délai élargi pour ce fichier seulement.
jest.setTimeout(15000);

/** Petit écran de test qui ouvre une confirmation et transmet la réponse. */
function Declencheur({ onReponse }: { onReponse: (ok: boolean) => void }) {
  const { confirmer } = useDialogue();
  return (
    <Bouton
      libelle="Ouvrir"
      // 📖 On LANCE la confirmation sans l'attendre : `onPress` se termine tout de
      //    suite et la réponse arrive plus tard via `.then`. Avec `async/await`,
      //    `fireEvent.press` (qui attend la fin de onPress) attendrait une réponse
      //    que le test ne peut donner qu'après : blocage.
      onPress={() => {
        void confirmer({
          titre: 'Supprimer mon compte',
          message: 'Cette action est irréversible.',
          libelleRester: 'Garder mon compte',
          libelleAction: 'Supprimer définitivement',
        }).then(onReponse);
      }}
    />
  );
}

async function ouvrirConfirmation() {
  const onReponse = jest.fn();
  await render(
    <DialogueProvider>
      <Declencheur onReponse={onReponse} />
    </DialogueProvider>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Ouvrir' }));
  return onReponse;
}

describe('DialogueProvider — confirmer', () => {
  it('affiche le titre et les deux choix', async () => {
    await ouvrirConfirmation();

    expect(screen.getByRole('header', { name: 'Supprimer mon compte' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Garder mon compte' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Supprimer définitivement' })).toBeTruthy();
  });

  it('renvoie false quand on choisit de rester', async () => {
    const onReponse = await ouvrirConfirmation();

    await fireEvent.press(screen.getByRole('button', { name: 'Garder mon compte' }));

    await waitFor(() => expect(onReponse).toHaveBeenCalledWith(false));
  });

  it("renvoie true quand on choisit l'action", async () => {
    const onReponse = await ouvrirConfirmation();

    await fireEvent.press(screen.getByRole('button', { name: 'Supprimer définitivement' }));

    await waitFor(() => expect(onReponse).toHaveBeenCalledWith(true));
  });
});