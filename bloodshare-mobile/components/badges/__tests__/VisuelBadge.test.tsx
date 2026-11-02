import { fireEvent, render, screen } from '@testing-library/react-native';
import { VisuelBadge } from '../VisuelBadge';

const URL = 'http://localhost:8000/storage/visuels/badges/premier-pas.webp';

describe('VisuelBadge', () => {
  it("affiche l'illustration du badge quand il en a une", async () => {
    await render(<VisuelBadge imageUrl={URL} emoji="🩸" taille={64} />);

    expect(screen.getByTestId('visuel-badge').props.source).toEqual({ uri: URL });
    expect(screen.queryByText('🩸')).toBeNull();
  });

  it("revient à l'emoji sans illustration", async () => {
    await render(<VisuelBadge imageUrl={null} emoji="🩸" taille={64} />);

    expect(screen.getByText('🩸')).toBeTruthy();
    expect(screen.queryByTestId('visuel-badge')).toBeNull();
  });

  it("revient à l'emoji quand l'illustration ne se charge pas", async () => {
    await render(<VisuelBadge imageUrl={URL} emoji="🩸" taille={64} />);

    await fireEvent(screen.getByTestId('visuel-badge'), 'error');

    expect(screen.getByText('🩸')).toBeTruthy();
  });
});
