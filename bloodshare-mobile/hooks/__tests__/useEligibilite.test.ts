import { act, renderHook } from '@testing-library/react-native';
import { QUESTIONS } from '../../constants/eligibilite';
import { useEligibilite } from '../useEligibilite';

// 📖 Le test se cale sur l'arbre réel de constants/eligibilite.ts : Q1 (âge) → Q2 (poids)
//    → Q3 (santé)... Si l'arbre change, ces tests le signaleront.
describe('useEligibilite', () => {
  it('commence à la première question, sans historique ni résultat', async () => {
    const { result } = await renderHook(() => useEligibilite());

    expect(result.current.questionActuelle.id).toBe(1);
    expect(result.current.historique).toEqual([]);
    expect(result.current.resultat).toBeNull();
    expect(result.current.progression).toBe(0);
    expect(result.current.peutRevenirArriere).toBe(false);
  });

  it('avance à la question suivante et mémorise le chemin', async () => {
    const { result } = await renderHook(() => useEligibilite());

    await act(() => result.current.repondre('oui'));

    expect(result.current.questionActuelle.id).toBe(2);
    expect(result.current.historique).toEqual([1]);
    expect(result.current.peutRevenirArriere).toBe(true);
  });

  it('fait progresser la barre à chaque réponse', async () => {
    const { result } = await renderHook(() => useEligibilite());

    await act(() => result.current.repondre('oui'));
    await act(() => result.current.repondre('oui'));

    expect(result.current.progression).toBeCloseTo((2 / 15) * 100);
  });

  it("s'arrête sur une contre-indication définitive (moins de 18 ans)", async () => {
    const { result } = await renderHook(() => useEligibilite());

    await act(() => result.current.repondre('non'));

    expect(result.current.resultat).toMatchObject({ eligible: false, type: 'definitive' });
  });

  it("s'arrête sur une contre-indication temporaire (pas en bonne santé)", async () => {
    const { result } = await renderHook(() => useEligibilite());

    await act(() => result.current.repondre('oui'));
    await act(() => result.current.repondre('oui'));
    await act(() => result.current.repondre('non'));

    expect(result.current.resultat).toMatchObject({ eligible: false, type: 'temporaire' });
  });

  it('revient à la question précédente', async () => {
    const { result } = await renderHook(() => useEligibilite());
    await act(() => result.current.repondre('oui'));
    await act(() => result.current.repondre('oui'));

    await act(() => result.current.revenirArriere());

    expect(result.current.questionActuelle.id).toBe(2);
    expect(result.current.historique).toEqual([1]);
  });

  it('ne fait rien en revenant en arrière depuis la première question', async () => {
    const { result } = await renderHook(() => useEligibilite());

    await act(() => result.current.revenirArriere());

    expect(result.current.questionActuelle.id).toBe(1);
  });

  it('recommence depuis zéro après un résultat', async () => {
    const { result } = await renderHook(() => useEligibilite());
    await act(() => result.current.repondre('oui'));
    await act(() => result.current.repondre('non'));

    await act(() => result.current.recommencer());

    expect(result.current.questionActuelle.id).toBe(1);
    expect(result.current.historique).toEqual([]);
    expect(result.current.resultat).toBeNull();
  });

  it('aboutit à « éligible » en répondant la réponse favorable à chaque question', async () => {
    const { result } = await renderHook(() => useEligibilite());

    // Prend à chaque étape la branche qui ne mène pas à un refus.
    for (let i = 0; i < QUESTIONS.length && !result.current.resultat; i++) {
      const q = result.current.questionActuelle;
      const brancheOui = q.reponse_oui;
      const favorable = 'suivant' in brancheOui || brancheOui.eligible ? 'oui' : 'non';
      await act(() => result.current.repondre(favorable));
    }

    expect(result.current.resultat).toEqual({ eligible: true });
  });
});
