import {
  dateActualite,
  dateActualiteLongue,
  dateEvenement,
  dateEvenementLongue,
  etiquetteProchainement,
  groupeAffiche,
  groupeLu,
  horaireEvenement,
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
  it('donne le jour et le mois de la pastille calendrier', () => {
    expect(dateEvenement('2026-10-08T08:30:00Z')).toEqual({ jour: '08', mois: 'OCT', moisLong: 'octobre' });
  });

  it('affiche l’horaire tel qu’enregistré', () => {
    expect(horaireEvenement('2026-09-20T09:00:00Z', '2026-09-20T17:30:00Z')).toBe('09h00 → 17h30');
    expect(horaireEvenement('2026-09-20T09:00:00Z', null)).toBe('09h00');
  });

  it('annonce les événements de la semaine à venir', () => {
    const maintenant = new Date(2026, 9, 28, 15, 0);
    expect(etiquetteProchainement('2026-10-28T09:00:00Z', maintenant)).toBe('Aujourd’hui');
    expect(etiquetteProchainement('2026-10-29T08:00:00Z', maintenant)).toBe('Demain');
    expect(etiquetteProchainement('2026-11-02T08:00:00Z', maintenant)).toBe('Dans 5 jours');
    expect(etiquetteProchainement('2026-11-10T08:00:00Z', maintenant)).toBeNull();
  });
});

describe('dates longues', () => {
  it('écrit la date d’un événement en toutes lettres', () => {
    expect(dateEvenementLongue('2026-09-20T09:00:00Z')).toBe('Dimanche 20 septembre 2026');
    expect(dateEvenementLongue('2026-10-01T09:00:00Z')).toBe('Jeudi 1er octobre 2026');
    expect(dateEvenementLongue('n’importe quoi')).toBe('n’importe quoi');
  });

  it('ajoute l’année à la date d’une actualité', () => {
    expect(dateActualiteLongue('2026-08-28')).toBe('28 août 2026');
    expect(dateActualiteLongue('bientôt')).toBe('bientôt');
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
