import { render, screen } from '@testing-library/react-native';
import { Theme } from '../../../constants/colors';
import { contraste } from '../../../utils/contraste';
import { Badge } from '../Badge';
import { BarreProgression } from '../BarreProgression';
import { NIVEAUX, PastilleStock } from '../PastilleStock';

describe('PastilleStock', () => {
  it.each(Object.keys(NIVEAUX) as (keyof typeof NIVEAUX)[])(
    '%s : libellé visible et annoncé, jamais la couleur seule',
    async (niveau) => {
      await render(<PastilleStock niveau={niveau} />);

      expect(screen.getByText(NIVEAUX[niveau].libelle)).toBeTruthy();
      expect(screen.getByLabelText(`Stock ${NIVEAUX[niveau].libelle.toLowerCase()}`)).toBeTruthy();
    },
  );

  it.each(Object.entries(NIVEAUX))('%s : icône lisible sur sa puce (≥ 3:1)', (_niveau, n) => {
    expect(contraste(n.iconePuce, n.puce)).toBeGreaterThanOrEqual(3);
  });
});

describe('Badge', () => {
  it('annonce un badge obtenu', async () => {
    await render(<Badge nom="Premier Pas" icone="water-outline" obtenu />);

    expect(screen.getByLabelText('Premier Pas, badge obtenu')).toBeTruthy();
  });

  it('annonce un badge à débloquer', async () => {
    await render(<Badge nom="Ambassadeur" icone="gift-outline" obtenu={false} />);

    expect(screen.getByLabelText('Ambassadeur, badge à débloquer')).toBeTruthy();
  });
});

describe('BarreProgression', () => {
  it("expose sa valeur aux lecteurs d'écran", async () => {
    await render(<BarreProgression titre="Collection 2026" valeur={4} max={12} detail="4 cartes sur 12" />);

    const barre = screen.getByRole('progressbar', { name: 'Collection 2026' });
    expect(barre.props.accessibilityValue).toEqual({ min: 0, max: 12, now: 4, text: '4 cartes sur 12' });
  });

  it('affiche le pourcentage par défaut', async () => {
    await render(<BarreProgression titre="Défi du mois" valeur={212} max={300} variante="surLime" />);

    expect(screen.getByText('71 %')).toBeTruthy();
  });

  it('le bloc niveau met une barre aubergine sur fond bleu canard pâle', async () => {
    await render(<BarreProgression titre="Niveau 2 — Informé" valeur={8} max={100} variante="surPetrole" />);

    const barre = screen.getByRole('progressbar', { name: 'Niveau 2 — Informé' });
    expect(barre).toHaveStyle({ backgroundColor: Theme.info.fond });
    expect(screen.getByText('8 %')).toHaveStyle({ color: Theme.texte.principal });
    // Texte sur le fond : 4,5:1 minimum ; barre aubergine sur sa piste blanche : 3:1 minimum.
    expect(contraste(Theme.texte.principal, Theme.info.fond)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(Theme.texte.principal, Theme.fond.surface)).toBeGreaterThanOrEqual(3);
  });

  it("ne déborde pas quand l'objectif est dépassé", async () => {
    await render(<BarreProgression titre="Défi du mois" valeur={310} max={300} />);

    expect(screen.getByText('100 %')).toBeTruthy();
  });

  it('ne plante pas avec un objectif à zéro', async () => {
    await render(<BarreProgression titre="Défi" valeur={0} max={0} />);

    expect(screen.getByText('0 %')).toBeTruthy();
  });
});