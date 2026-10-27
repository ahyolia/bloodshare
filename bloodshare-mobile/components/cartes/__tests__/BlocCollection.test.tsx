import { fireEvent, render, screen } from '@testing-library/react-native';
import { BlocCollection } from '../BlocCollection';

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

const carte = (mois_numero: number, obtenue: boolean) => ({
  id: mois_numero,
  titre: `Carte ${mois_numero}`,
  mois_numero,
  annee: 2026,
  image_url: null,
  obtenue,
});

describe('BlocCollection', () => {
  it("annonce l'année, la collection en cours et la progression, et s'ouvre", async () => {
    const ouvrir = jest.fn();
    await render(
      <BlocCollection
        collection={{ annee: 2026, pourcentage_complete: 16.7, cartes: [carte(10, true), carte(11, true), carte(12, false)] }}
        enCours
        onPress={ouvrir}
      />
    );

    await fireEvent.press(screen.getByLabelText('Collection 2026, en cours, 2 cartes sur 12'));

    expect(ouvrir).toHaveBeenCalled();
    expect(screen.getByText('En cours')).toBeTruthy();
  });

  it("ne dit pas « en cours » pour une année passée", async () => {
    await render(
      <BlocCollection
        collection={{ annee: 2025, pourcentage_complete: 0, cartes: [carte(1, false)] }}
        enCours={false}
        onPress={jest.fn()}
      />
    );

    expect(screen.getByLabelText('Collection 2025, 0 carte sur 12')).toBeTruthy();
    expect(screen.queryByText('En cours')).toBeNull();
  });
});
