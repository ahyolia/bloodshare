import { QUESTIONS, resultatPour, TOTAL_QUESTIONS } from '../eligibilite';

describe('critères d’éligibilité', () => {
  it('reprend les 15 critères du Don du Sang, avec des identifiants uniques', () => {
    expect(TOTAL_QUESTIONS).toBe(15);
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(15);
  });

  it('explique chaque réponse bloquante', () => {
    for (const question of QUESTIONS) {
      expect(question.motif.length).toBeGreaterThan(0);
    }
  });

  it('ne laisse aucune mention de contre-indication définitive ni de CHT', () => {
    const textes = QUESTIONS.flatMap((q) => [q.texte, q.sous_texte ?? '', q.motif]).join(' ');

    expect(textes).not.toMatch(/définitiv|CHT/i);
  });
});

describe('resultatPour', () => {
  const age = QUESTIONS[0]; // bloquante : « non »

  it('continue sur la réponse favorable', () => {
    expect(resultatPour(age, 'oui')).toBeNull();
  });

  it("s'arrête sur la réponse bloquante, avec la question (et donc son motif)", () => {
    expect(resultatPour(age, 'non')).toEqual({ statut: 'bloque', question: age, reponse: 'non' });
  });

  it('renvoie vers le Don du Sang sur « Je ne sais pas »', () => {
    expect(resultatPour(age, 'ne_sait_pas')).toEqual({ statut: 'a_verifier', question: age });
  });

  it('classe chaque question : délai, critère de base ou avis médical', () => {
    expect(QUESTIONS.filter((q) => q.nature === 'critere').map((q) => q.id)).toEqual([1, 2]);
    expect(QUESTIONS.filter((q) => q.nature === 'medecin').map((q) => q.id)).toEqual([7, 8, 9]);
  });
});
