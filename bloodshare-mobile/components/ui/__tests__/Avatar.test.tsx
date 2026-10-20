import { render, screen } from '@testing-library/react-native';
import { Avatar } from '../Avatar';
import { AVATARS, avatarParId } from '../../../services/profil.service';

describe('Avatar', () => {
  it('affiche l’emoji de l’avatar choisi', async () => {
    await render(<Avatar avatarId={3} pseudo="camille" taille={48} />);

    expect(screen.getByText('🍀', { includeHiddenElements: true })).toBeTruthy();
  });

  it('retombe sur l’initiale du pseudo sans avatar', async () => {
    await render(<Avatar avatarId={null} pseudo="camille" taille={48} />);

    expect(screen.getByText('C', { includeHiddenElements: true })).toBeTruthy();
  });

  it('retombe sur l’initiale pour un id inconnu de l’app', async () => {
    await render(<Avatar avatarId={999} pseudo="camille" taille={48} />);

    expect(screen.getByText('C', { includeHiddenElements: true })).toBeTruthy();
  });
});

describe('Catalogue AVATARS', () => {
  it('a des ids uniques', () => {
    const ids = AVATARS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('retrouve un avatar par son id', () => {
    expect(avatarParId(8)?.emoji).toBe('💧');
    expect(avatarParId(null)).toBeUndefined();
  });
});
