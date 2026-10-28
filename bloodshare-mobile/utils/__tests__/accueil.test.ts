import {
  dateActualite,
  dateActualiteLongue,
  dateEvenement,
  dateEvenementLongue,
  etiquetteProchainement,
  groupeAffiche,
  groupeLu,
  horaireEvenement,
  pageCarrousel,
  resumeStocks,
} from '../accueil';

describe('groupes sanguins', () => {
  it('affiche le vrai signe moins et se lit en toutes lettres', () => {
    expect(groupeAffiche('AB-')).toBe('AB−');
    expect(groupeAffiche('O+')).toBe('O+');
    expect(groupeLu('O-')).toBe('O négatif');
    expect(groupeLu('AB+')).toBe('AB positif');
  });
});

describe('resumeStocks', () => {
  it('met en avant les groupes critiques', () => {
    expect(
      resumeStocks([
        { groupe: 'O-', niveau: 'critique' },
        { groupe: 'A+', niveau: 'critique' },
        { groupe: 'B-', niveau: 'bas' },
      ])
    ).toBe('Besoin urgent en O− et A+. Ton don compte !');
  });

  it('signale ensuite les groupes bas', () => {
    expect(
      resumeStocks([
        { groupe: 'O+', niveau: 'bas' },
        { groupe: 'B-', niveau: 'bas' },
        { groupe: 'A-', niveau: 'bas' },
        { groupe: 'A+', niveau: 'bon' },
      ])
    ).toBe('Les réserves baissent en O+, B− et A−.');
  });

  it('rassure quand tout va bien, ou dit que rien n’est communiqué', () => {
    expect(resumeStocks([{ groupe: 'A+', niveau: 'bon' }])).toBe('Les réserves tiennent bon, merci aux donneurs !');
    expect(resumeStocks([{ groupe: 'A+', niveau: null }])).toBe('Les niveaux ne sont pas encore communiqués.');
  });
});

describe('événements', () => {
  // 📖 Dates telles que l'API les renvoie : le vrai instant en UTC, Nouméa étant à UTC+11.
  it('donne le jour et le mois de la pastille calendrier, à Nouméa', () => {
    expect(dateEvenement('2026-10-08T08:30:00Z')).toEqual({ jour: '08', mois: 'OCT', moisLong: 'octobre' });
    // 7 h à Nouméa le 8 octobre = 20 h UTC la veille.
    expect(dateEvenement('2026-10-07T20:00:00Z')).toEqual({ jour: '08', mois: 'OCT', moisLong: 'octobre' });
  });

  it('affiche l’horaire à l’heure de Nouméa', () => {
    // Forum du 29/10 : 13 h 30 → 17 h 30 à Nouméa.
    expect(horaireEvenement('2026-10-29T02:30:00Z', '2026-10-29T06:30:00Z')).toBe('13h30 → 17h30');
    expect(horaireEvenement('2026-10-29T02:30:00Z', null)).toBe('13h30');
  });

  it('annonce les événements de la semaine à venir', () => {
    const maintenant = new Date(2026, 9, 28, 15, 0);
    expect(etiquetteProchainement('2026-10-28T02:30:00Z', maintenant)).toBe('Aujourd’hui');
    // 8 h à Nouméa le 29 = 21 h UTC le 28 : c'est bien demain.
    expect(etiquetteProchainement('2026-10-28T21:00:00Z', maintenant)).toBe('Demain');
    expect(etiquetteProchainement('2026-11-02T08:00:00Z', maintenant)).toBe('Dans 5 jours');
    expect(etiquetteProchainement('2026-11-10T08:00:00Z', maintenant)).toBeNull();
  });
});

describe('dates longues', () => {
  it('écrit la date d’un événement en toutes lettres, à Nouméa', () => {
    expect(dateEvenementLongue('2026-09-20T09:00:00Z')).toBe('Dimanche 20 septembre 2026');
    // 8 h à Nouméa le 1er octobre = 21 h UTC le 30 septembre.
    expect(dateEvenementLongue('2026-09-30T21:00:00Z')).toBe('Jeudi 1er octobre 2026');
    expect(dateEvenementLongue('n’importe quoi')).toBe('n’importe quoi');
  });

  it('ajoute l’année à la date d’une actualité', () => {
    expect(dateActualiteLongue('2026-08-28')).toBe('28 août 2026');
    expect(dateActualiteLongue('2026-07-01T10:00:00Z')).toBe('1er juillet 2026');
    expect(dateActualiteLongue('bientôt')).toBe('bientôt');
    expect(dateActualiteLongue('')).toBe('');
  });
});

describe('pageCarrousel', () => {
  const position = (decalage: number) => ({ decalage, largeurContenu: 840, largeurVisible: 480 });

  it('suit la page la plus proche pendant le défilement', () => {
    expect(pageCarrousel(position(0), 272, 3)).toBe(0);
    expect(pageCarrousel(position(250), 272, 3)).toBe(1);
  });

  it('allume le dernier point en fin de défilement, même avant son point d’accroche', () => {
    // Zone visible plus large qu'une carte : le défilement s'arrête à 360 px, et
    // round(360 / 272) = 1 ne désignerait jamais la 3ᵉ carte.
    expect(pageCarrousel(position(360), 272, 3)).toBe(2);
    // Réserves : 2 pages de 360 px, mais un défilement maximal de 150 px.
    expect(pageCarrousel({ decalage: 150, largeurContenu: 630, largeurVisible: 480 }, 360, 2)).toBe(1);
  });

  it('reste sur la première page quand il n’y a qu’une page', () => {
    expect(pageCarrousel(position(360), 272, 1)).toBe(0);
  });
});

describe('dateActualite', () => {
  it('écrit la date sans l’année', () => {
    expect(dateActualite('2026-08-28')).toBe('28 août');
    expect(dateActualite('2026-07-01T10:00:00Z')).toBe('1er juillet');
  });

  it('renvoie une date illisible telle quelle', () => {
    expect(dateActualite('bientôt')).toBe('bientôt');
  });
});
