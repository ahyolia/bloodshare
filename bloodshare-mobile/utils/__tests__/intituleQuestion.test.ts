import { decouperIntitule } from '../intituleQuestion';

describe('decouperIntitule', () => {
  it('sépare le contexte de la question finale', () => {
    expect(
      decouperIntitule(
        "Ton retour d'un voyage dans une zone impaludée date d'il y a 3 mois. Peux-tu donner ton sang aujourd'hui ?"
      )
    ).toEqual({
      contexte: "Ton retour d'un voyage dans une zone impaludée date d'il y a 3 mois.",
      question: "Peux-tu donner ton sang aujourd'hui ?",
    });
  });

  it('garde entière une question courte', () => {
    expect(decouperIntitule('Quel est le poids minimum pour donner son sang ?')).toEqual({
      contexte: null,
      question: 'Quel est le poids minimum pour donner son sang ?',
    });
  });

  it('garde entière une affirmation « vrai ou faux »', () => {
    expect(decouperIntitule('Une femme enceinte peut donner son sang si elle se sent en forme.')).toEqual({
      contexte: null,
      question: 'Une femme enceinte peut donner son sang si elle se sent en forme.',
    });
  });

  it('coupe sur la dernière phrase seulement', () => {
    expect(decouperIntitule('Tu as de la fièvre et tu tousses depuis hier. Peux-tu donner ton sang ?')).toEqual({
      contexte: 'Tu as de la fièvre et tu tousses depuis hier.',
      question: 'Peux-tu donner ton sang ?',
    });
  });
});
