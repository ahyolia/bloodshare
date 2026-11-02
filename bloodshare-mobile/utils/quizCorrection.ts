import type { Correction } from '../services/quiz.service';

/**
 * Apparence d'une réponse dans une question du quiz.
 * - `neutre` / `selectionnee` : la question n'est pas encore validée ;
 * - `correcte` : bonne réponse, montrée après validation (cochée ou non) ;
 * - `erreur` : réponse cochée à tort ;
 * - `attenuee` : mauvaise réponse non cochée, mise en retrait.
 */
export type EtatReponse = 'neutre' | 'selectionnee' | 'correcte' | 'erreur' | 'attenuee';

/**
 * 📖 Fonction pure : l'écran du quiz s'en sert pour styler chaque réponse, et elle se teste
 *    sans monter de composant.
 */
export const etatReponse = (
  reponseId: number,
  selection: number[],
  correction?: Correction
): EtatReponse => {
  const cochee = selection.includes(reponseId);

  if (!correction) return cochee ? 'selectionnee' : 'neutre';
  if (correction.reponses_correctes.includes(reponseId)) return 'correcte';

  return cochee ? 'erreur' : 'attenuee';
};
