import { Theme } from '../colors';
import { contraste } from '../../utils/contraste';

const TEXTE = 4.5;
const CONTOUR = 3;

describe('contrastes du thème (WCAG AA)', () => {
  it.each([
    ['bouton principal', Theme.action.primaireTexte, Theme.action.primaire],
    ['bouton principal pressé', Theme.action.primaireTexte, Theme.action.primairePresse],
    ['bouton destructif', Theme.action.primaireTexte, Theme.action.destructive],
    ['bouton secondaire', Theme.action.secondaireTexte, Theme.fond.surface],
    ['bouton discret', Theme.action.discreteTexte, Theme.fond.page],
    ['texte principal sur la page', Theme.texte.principal, Theme.fond.page],
    ['texte secondaire sur la page', Theme.texte.secondaire, Theme.fond.page],
    ["message d'erreur", Theme.feedback.erreurTexte, Theme.feedback.erreurSurface],
    ['erreur sur la surface', Theme.feedback.erreurTexte, Theme.fond.surface],
    ["initiale de l'avatar", Theme.marque.principal, Theme.marque.doux],
    ['texte sur la couleur signature', Theme.accent.signatureTexte, Theme.accent.signatureAplat],
  ])('texte — %s ≥ 4,5:1', (_nom, texte, fond) => {
    expect(contraste(texte, fond)).toBeGreaterThanOrEqual(TEXTE);
  });

  it.each([
    ["contour d'un champ", Theme.formulaire.bordure, Theme.fond.surface],
    ['contour au focus', Theme.formulaire.focus, Theme.fond.surface],
    ['contour du bouton secondaire', Theme.action.secondaireBordure, Theme.fond.surface],
    ['jauge « critique »', Theme.etat.critique.jauge, Theme.fond.surface],
    ["icône d'information", Theme.info.icone, Theme.info.fond],
  ])('contour — %s ≥ 3:1', (_nom, contour, fond) => {
    expect(contraste(contour, fond)).toBeGreaterThanOrEqual(CONTOUR);
  });
});