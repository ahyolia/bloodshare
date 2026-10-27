import { act, render, screen, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Animated, Text } from 'react-native';
import { FondDecoratif, type Forme } from '../FondDecoratif';

describe('FondDecoratif', () => {
  it('affiche le contenu par-dessus les formes', async () => {
    await render(
      <FondDecoratif formes={[{ type: 'rond', couleur: 'lime', taille: 40, position: { top: 0, right: 0 } }]}>
        <Text>Bon retour !</Text>
      </FondDecoratif>,
    );

    expect(screen.getByText('Bon retour !')).toBeTruthy();
  });

  it('les formes sont invisibles pour les lecteurs d’écran', async () => {
    await render(
      <FondDecoratif formes={[{ type: 'ellipse', couleur: 'rose', taille: 300, position: { top: 0, left: 0 } }]}>
        <Text>Contenu</Text>
      </FondDecoratif>,
    );

    expect(screen.getAllByText(/./)).toHaveLength(1);
  });
});

describe('FondDecoratif — animation', () => {
  const FORMES: Forme[] = [
    { type: 'ellipse', couleur: 'rose', taille: 300, position: { top: 0, left: 0 } },
    { type: 'rond', couleur: 'corail', taille: 40, position: { top: 0, right: 0 } },
    { type: 'pilule', couleur: 'petrole', taille: 44, position: { bottom: 0, left: 0 } },
  ];

  let reduire: jest.SpyInstance;
  beforeEach(() => {
    reduire = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });
  afterEach(() => jest.restoreAllMocks());

  it('anime : seules les petites formes flottent, pas la grande ellipse', async () => {
    const loop = jest.spyOn(Animated, 'loop');

    await render(
      <FondDecoratif formes={FORMES} anime>
        <Text>Contenu</Text>
      </FondDecoratif>,
    );

    // 2 petites formes × 2 mouvements (horizontal et vertical).
    await waitFor(() => expect(loop).toHaveBeenCalledTimes(4));
  });

  it('immobile par défaut', async () => {
    // 📖 L'espion garde des appels du test précédent : on repart de zéro.
    reduire.mockClear();
    await render(
      <FondDecoratif formes={FORMES}>
        <Text>Contenu</Text>
      </FondDecoratif>,
    );
    await act(async () => {});

    expect(reduire).not.toHaveBeenCalled();
  });
});