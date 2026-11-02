import { render, screen } from '@testing-library/react-native';
import { CriteresMotDePasse } from '../CriteresMotDePasse';

describe('CriteresMotDePasse', () => {
  it('affiche les 4 critères', async () => {
    await render(<CriteresMotDePasse motDePasse="" />);

    for (const libelle of ['8 caractères', '1 majuscule', '1 minuscule', '1 chiffre']) {
      expect(screen.getByText(libelle)).toBeTruthy();
    }
  });

  it('annonce l’état de chaque critère', async () => {
    await render(<CriteresMotDePasse motDePasse="Lumi" />);

    expect(screen.getByLabelText('1 majuscule : validé')).toBeTruthy();
    expect(screen.getByLabelText('1 chiffre : pas encore')).toBeTruthy();
  });
});