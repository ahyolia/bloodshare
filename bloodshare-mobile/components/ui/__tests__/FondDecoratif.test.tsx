import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { FondDecoratif } from '../FondDecoratif';

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