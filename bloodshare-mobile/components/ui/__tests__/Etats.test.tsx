import { fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Animated } from 'react-native';
import { Chargement } from '../Chargement';
import { EtatErreur } from '../EtatErreur';
import { EtatVide } from '../EtatVide';

describe('EtatVide', () => {
  it("affiche le titre, le message et l'action", async () => {
    const onAction = jest.fn();
    await render(
      <EtatVide
        titre="Ta collection t'attend"
        message="Après ton prochain don, la carte du mois viendra s'installer ici."
        libelleAction="Découvrir les quiz"
        onAction={onAction}
      />,
    );

    expect(screen.getByRole('header', { name: "Ta collection t'attend" })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Découvrir les quiz' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("n'affiche jamais le texte provisoire de la mascotte", async () => {
    await render(<EtatVide titre="Vide" message="Rien pour l'instant." />);

    expect(screen.queryByText(/MASCOTTE/i)).toBeNull();
  });
});

describe('EtatErreur', () => {
  it('rassure avec les textes par défaut et propose de réessayer', async () => {
    const onReessayer = jest.fn();
    await render(<EtatErreur onReessayer={onReessayer} />);

    expect(screen.getByText('La connexion fait une pause')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Réessayer' }));
    expect(onReessayer).toHaveBeenCalledTimes(1);
  });
});

describe('Chargement', () => {
  it("annonce son message aux lecteurs d'écran", async () => {
    await render(<Chargement />);

    expect(screen.getByLabelText('Un instant, on prépare tout ça…')).toBeTruthy();
  });

  it("ne lance pas d'animation si « Réduire les animations » est activé", async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const loop = jest.spyOn(Animated, 'loop');

    await render(<Chargement />);

    expect(loop).not.toHaveBeenCalled();
    loop.mockRestore();
  });
});