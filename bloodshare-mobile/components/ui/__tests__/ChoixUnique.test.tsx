import { fireEvent, render, screen } from '@testing-library/react-native';
import { ChoixUnique } from '../ChoixUnique';

const OPTIONS = [
  { valeur: 'homme', libelle: 'Homme' },
  { valeur: 'femme', libelle: 'Femme' },
] as const;

describe('ChoixUnique', () => {
  it('annonce chaque option comme un radio, avec son état', async () => {
    await render(
      <ChoixUnique libelle="Sexe biologique" options={[...OPTIONS]} valeur="femme" onChange={jest.fn()} />,
    );

    expect(screen.getByRole('radio', { name: 'Femme' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Homme' })).not.toBeChecked();
  });

  it('transmet la valeur choisie', async () => {
    const onChange = jest.fn();
    await render(
      <ChoixUnique libelle="Sexe biologique" options={[...OPTIONS]} valeur={null} onChange={onChange} />,
    );

    await fireEvent.press(screen.getByRole('radio', { name: 'Homme' }));

    expect(onChange).toHaveBeenCalledWith('homme');
  });

  it('affiche l’erreur', async () => {
    await render(
      <ChoixUnique
        libelle="Sexe biologique"
        options={[...OPTIONS]}
        valeur={null}
        onChange={jest.fn()}
        erreur="Choisis une réponse pour continuer."
      />,
    );

    expect(screen.getByText('Choisis une réponse pour continuer.')).toBeTruthy();
  });

  it('une erreur vide n’affiche rien (et ne fait pas planter l’écran)', async () => {
    await render(
      <ChoixUnique libelle="Sexe biologique" options={[...OPTIONS]} valeur={null} onChange={jest.fn()} erreur="" />,
    );

    // Le libellé et les options seulement : aucun bloc d'erreur.
    expect(screen.queryAllByText(/./)).toHaveLength(1 + OPTIONS.length);
  });
});