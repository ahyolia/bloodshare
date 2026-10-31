import { fireEvent, render, screen } from '@testing-library/react-native';
import { IndicateurEtapes } from '../IndicateurEtapes';

describe('IndicateurEtapes', () => {
  it('annonce la progression en une seule phrase', async () => {
    await render(<IndicateurEtapes etape={2} total={4} />);

    expect(screen.getByLabelText('Étape 2 sur 4')).toBeTruthy();
  });

  it('sans onRetour ni action, n’affiche aucun bouton', async () => {
    await render(<IndicateurEtapes etape={1} total={3} />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('Retour et l’action déclenchent leurs fonctions', async () => {
    const onRetour = jest.fn();
    const passer = jest.fn();
    await render(
      <IndicateurEtapes
        etape={2}
        total={3}
        onRetour={onRetour}
        libelleRetour="Écran précédent"
        action={{ libelle: 'Passer', onPress: passer }}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Écran précédent' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Passer' }));

    expect(onRetour).toHaveBeenCalledTimes(1);
    expect(passer).toHaveBeenCalledTimes(1);
  });
});