import api from '../api';
import { getActualites } from '../actualites.service';
import { getBanniere } from '../bannieres.service';
import { getEvenements } from '../evenements.service';
import { getFicheInfo, getFichesInfos } from '../fichesInfos.service';
import { getStockSang, GROUPES_SANGUINS } from '../stockSang.service';

// 📖 Services du contenu éditorial public (accueil, fiches, stock) : ils lisent l'API
//    sans token et adaptent parfois la réponse pour que les écrans en restent indépendants.
jest.mock('../../constants/config', () => ({ USE_MOCK_DATA: false }));

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const apiGet = api.get as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getActualites', () => {
  it('appelle GET /actualites et renvoie la liste', async () => {
    const actualites = [{ id: 1, titre: 'Journée mondiale', image_url: null, published_at: '2026-06-14' }];
    apiGet.mockResolvedValue({ data: actualites });

    await expect(getActualites()).resolves.toEqual(actualites);
    expect(apiGet).toHaveBeenCalledWith('/actualites');
  });
});

describe('getBanniere', () => {
  it("renvoie la bannière telle quelle, même inactive (c'est l'écran qui masque)", async () => {
    apiGet.mockResolvedValue({ data: { active: false } });

    await expect(getBanniere()).resolves.toEqual({ active: false });
    expect(apiGet).toHaveBeenCalledWith('/bannieres');
  });
});

describe('getEvenements', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-15T10:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const evenement = (id: number, date_heure: string) => ({ id, titre: `Événement ${id}`, lieu: 'Nouméa', date_heure });

  it('trie les événements du plus proche au plus lointain', async () => {
    apiGet.mockResolvedValue({
      data: [evenement(1, '2026-12-01T09:00:00Z'), evenement(2, '2026-10-20T09:00:00Z'), evenement(3, '2026-11-01T09:00:00Z')],
    });

    const evenements = await getEvenements();

    expect(evenements.map((e) => e.id)).toEqual([2, 3, 1]);
  });

  it('écarte un événement passé pendant la session', async () => {
    apiGet.mockResolvedValue({ data: [evenement(1, '2026-10-15T09:59:00Z'), evenement(2, '2026-10-15T10:01:00Z')] });

    const evenements = await getEvenements();

    expect(evenements.map((e) => e.id)).toEqual([2]);
  });

  it('renvoie une liste vide sans événement', async () => {
    apiGet.mockResolvedValue({ data: [] });

    await expect(getEvenements()).resolves.toEqual([]);
  });
});

describe('fiches infos', () => {
  const fiches = [
    { id: 1, titre: 'Qui peut donner ?', categorie: 'Bases', contenu: '...' },
    { id: 2, titre: 'Après le don', categorie: 'Conseils', contenu: '...' },
  ];

  it('getFichesInfos appelle GET /fiches-infos', async () => {
    apiGet.mockResolvedValue({ data: fiches });

    await expect(getFichesInfos()).resolves.toEqual(fiches);
    expect(apiGet).toHaveBeenCalledWith('/fiches-infos');
  });

  it('getFicheInfo retrouve une fiche par son id', async () => {
    apiGet.mockResolvedValue({ data: fiches });

    await expect(getFicheInfo(2)).resolves.toEqual(fiches[1]);
  });

  it('getFicheInfo renvoie undefined pour un id inconnu', async () => {
    apiGet.mockResolvedValue({ data: fiches });

    await expect(getFicheInfo(99)).resolves.toBeUndefined();
  });
});

describe('getStockSang', () => {
  it('renomme `groupe_sanguin` en `groupe`', async () => {
    apiGet.mockResolvedValue({ data: [{ groupe_sanguin: 'O-', niveau: 'critique' }, { groupe_sanguin: 'A+', niveau: null }] });

    await expect(getStockSang()).resolves.toEqual([
      { groupe: 'O-', niveau: 'critique' },
      { groupe: 'A+', niveau: null },
    ]);
    expect(apiGet).toHaveBeenCalledWith('/stock-sang');
  });

  it('expose les 8 groupes sanguins sans doublon', () => {
    expect(GROUPES_SANGUINS).toHaveLength(8);
    expect(new Set(GROUPES_SANGUINS).size).toBe(8);
  });
});
