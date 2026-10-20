import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { CarteChiffre } from '../CarteChiffre';
import { EnTeteSousPage } from '../EnTeteSousPage';
import { FeuilleBas } from '../FeuilleBas';
import { Groupe, Separateur } from '../Groupe';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));
// 📖 Reanimated a besoin du moteur natif de worklets, absent de Jest : on prend
//    le mock fourni par la bibliothèque (les animations d'entrée deviennent inertes).
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('EnTeteSousPage', () => {
  it('annonce le titre comme en-tête', async () => {
    await render(<EnTeteSousPage titre="Mes badges" />);

    expect(screen.getByRole('header', { name: 'Mes badges' })).toBeTruthy();
  });

  it('revient à l’écran précédent', async () => {
    await render(<EnTeteSousPage titre="Paramètres" />);

    await fireEvent.press(screen.getByRole('button', { name: 'Retour' }));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});

describe('CarteChiffre', () => {
  it('se lit comme un tout : valeur puis libellé', async () => {
    await render(<CarteChiffre valeur="3" libelle="Dons" icone="water-outline" teinte="corail" />);

    expect(screen.getByLabelText('3 dons')).toBeTruthy();
  });
});

describe('Groupe', () => {
  it('affiche ses lignes', async () => {
    await render(
      <Groupe>
        <Text>Ligne 1</Text>
        <Separateur />
        <Text>Ligne 2</Text>
      </Groupe>,
    );

    expect(screen.getByText('Ligne 1')).toBeTruthy();
    expect(screen.getByText('Ligne 2')).toBeTruthy();
  });
});

describe('FeuilleBas', () => {
  it('affiche son contenu et prévient le parent une fois refermée', async () => {
    const onFermer = jest.fn();
    await render(
      <FeuilleBas visible onFermer={onFermer}>
        <Text>Incollable</Text>
      </FeuilleBas>,
    );

    expect(screen.getByText('Incollable')).toBeTruthy();

    // 📖 Le mock de Reanimated termine l'animation de fermeture aussitôt.
    await fireEvent.press(screen.getByRole('button', { name: 'Fermer' }));

    expect(onFermer).toHaveBeenCalledTimes(1);
  });
});
