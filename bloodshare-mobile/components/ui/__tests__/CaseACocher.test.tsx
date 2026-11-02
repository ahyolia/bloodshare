import { fireEvent, render, screen } from '@testing-library/react-native';
import { CaseACocher } from '../CaseACocher';

describe('CaseACocher', () => {
  it('annonce la phrase entière et l’état de la case', async () => {
    await render(
      <CaseACocher
        libelle="J’accepte la"
        lien={{ texte: 'politique de confidentialité', onPress: jest.fn() }}
        coche={false}
        onChange={jest.fn()}
      />,
    );

    expect(
      screen.getByRole('checkbox', { name: 'J’accepte la politique de confidentialité' }),
    ).not.toBeChecked();
  });

  it('se coche via la case', async () => {
    const onChange = jest.fn();
    await render(<CaseACocher libelle="J’ai au moins 18 ans." coche={false} onChange={onChange} />);

    await fireEvent.press(screen.getByRole('checkbox'));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('le lien ouvre le document sans cocher la case', async () => {
    const onChange = jest.fn();
    const ouvrir = jest.fn();
    await render(
      <CaseACocher
        libelle="J’accepte les"
        lien={{ texte: 'conditions générales d’utilisation', onPress: ouvrir }}
        coche={false}
        onChange={onChange}
      />,
    );

    await fireEvent.press(screen.getByRole('link', { name: 'conditions générales d’utilisation' }));

    expect(ouvrir).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  // 📖 Sur la PWA (react-native-web), l'appui sur le lien remontait jusqu'au texte, qui
  //    cochait le consentement sans que la personne le voie (RGPD).
  it('avec un lien, ni le lien ni le texte ne cochent la case', async () => {
    const onChange = jest.fn();
    const stopPropagation = jest.fn();
    await render(
      <CaseACocher
        libelle="J’accepte la"
        lien={{ texte: 'politique de confidentialité', onPress: jest.fn() }}
        coche={false}
        onChange={onChange}
      />,
    );

    await fireEvent.press(screen.getByRole('link', { name: 'politique de confidentialité' }), { stopPropagation });
    await fireEvent.press(screen.getByText('J’accepte la politique de confidentialité'));

    expect(stopPropagation).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('sans lien, le texte coche aussi la case', async () => {
    const onChange = jest.fn();
    await render(<CaseACocher libelle="J’ai au moins 18 ans." coche={false} onChange={onChange} />);

    await fireEvent.press(screen.getByText('J’ai au moins 18 ans.'));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('une erreur vide n’affiche rien (et ne fait pas planter l’écran)', async () => {
    await render(<CaseACocher libelle="J’ai au moins 18 ans." coche={false} onChange={jest.fn()} erreur="" />);

    expect(screen.queryAllByText(/./)).toHaveLength(1);
  });
});