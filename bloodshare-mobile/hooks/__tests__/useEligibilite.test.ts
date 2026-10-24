import { act, renderHook } from '@testing-library/react-native';
import { QUESTIONS, TOTAL_QUESTIONS } from '../../constants/eligibilite';
import { effacerQuestionnaire, questionnaireEnCours } from '../../stores/eligibilite.store';
import { useEligibilite } from '../useEligibilite';

// Réponse qui laisse continuer le questionnaire, pour chaque question.
const favorable = (index: number) => (QUESTIONS[index].reponse_bloquante === 'oui' ? 'non' : 'oui');

beforeEach(() => effacerQuestionnaire());

describe('useEligibilite', () => {
  it('commence à la première question, sans résultat', async () => {
    const { result } = await renderHook(() => useEligibilite());

    expect(result.current.questionActuelle.id).toBe(1);
    expect(result.current.numeroQuestion).toBe(1);
    expect(result.current.resultat).toBeNull();
    expect(result.current.peutRevenirArriere).toBe(false);
  });

  it('avance à la question suivante sur une réponse favorable', async () => {
    const { result } = await renderHook(() => useEligibilite());

    await act(() => result.current.repondre(favorable(0)));

    expect(result.current.questionActuelle.id).toBe(2);
    expect(result.current.numeroQuestion).toBe(2);
    expect(result.current.peutRevenirArriere).toBe(true);
  });

  it('aboutit à « éligible » avec une réponse favorable à chaque question', async () => {
    const { result } = await renderHook(() => useEligibilite());

    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      await act(() => result.current.repondre(favorable(i)));
    }

    expect(result.current.resultat).toEqual({ statut: 'eligible' });
  });

  it("s'arrête sur un délai avec le motif de la question, sans verdict définitif", async () => {
    const { result } = await renderHook(() => useEligibilite());

    await act(() => result.current.repondre('non')); // moins de 18 ou plus de 70 ans

    expect(result.current.resultat).toEqual({ statut: 'delai', motif: QUESTIONS[0].motif });
  });

  it('renvoie vers le Don du Sang sur « Je ne sais pas »', async () => {
    const { result } = await renderHook(() => useEligibilite());
    await act(() => result.current.repondre(favorable(0)));

    await act(() => result.current.repondre('ne_sait_pas'));

    expect(result.current.resultat).toEqual({ statut: 'a_verifier', question: QUESTIONS[1].texte });
  });

  it("pose la question de l'alcool et de la drogue sur 72 heures, avec un délai et non un refus définitif", async () => {
    const { result } = await renderHook(() => useEligibilite());
    for (let i = 0; i < TOTAL_QUESTIONS - 1; i++) {
      await act(() => result.current.repondre(favorable(i)));
    }

    expect(result.current.questionActuelle.texte).toMatch(/alcool.*drogue.*72/);
    await act(() => result.current.repondre('oui'));

    expect(result.current.resultat).toMatchObject({ statut: 'delai' });
  });

  it('revient à la question précédente', async () => {
    const { result } = await renderHook(() => useEligibilite());
    await act(() => result.current.repondre(favorable(0)));
    await act(() => result.current.repondre(favorable(1)));

    await act(() => result.current.revenirArriere());

    expect(result.current.questionActuelle.id).toBe(2);
  });

  it('revient du résultat à la question qui l’a déclenché', async () => {
    const { result } = await renderHook(() => useEligibilite());
    await act(() => result.current.repondre(favorable(0)));
    await act(() => result.current.repondre('non')); // moins de 50 kg

    await act(() => result.current.revenirArriere());

    expect(result.current.resultat).toBeNull();
    expect(result.current.questionActuelle.id).toBe(2);
  });

  it('recommence depuis zéro', async () => {
    const { result } = await renderHook(() => useEligibilite());
    await act(() => result.current.repondre(favorable(0)));
    await act(() => result.current.repondre('non'));

    await act(() => result.current.recommencer());

    expect(result.current.questionActuelle.id).toBe(1);
    expect(result.current.resultat).toBeNull();
  });
});

describe('reprise du questionnaire', () => {
  it('reprend à la même question après avoir quitté l’écran', async () => {
    const premier = await renderHook(() => useEligibilite());
    await act(() => premier.result.current.repondre(favorable(0)));
    await act(() => premier.result.current.repondre(favorable(1)));
    await premier.unmount();

    expect(questionnaireEnCours()).toEqual({ numero: 3, total: TOTAL_QUESTIONS });

    const second = await renderHook(() => useEligibilite());
    expect(second.result.current.questionActuelle.id).toBe(3);
  });

  it("n'est plus en cours une fois le résultat affiché", async () => {
    const { result } = await renderHook(() => useEligibilite());
    await act(() => result.current.repondre(favorable(0)));

    await act(() => result.current.repondre('non'));

    expect(questionnaireEnCours()).toBeNull();
  });

  it("n'est pas en cours tant qu'aucune question n'a été répondue", async () => {
    await renderHook(() => useEligibilite());

    expect(questionnaireEnCours()).toBeNull();
  });
});
