import { Theme } from '../colors';

/**
 * 📖 Contraste WCAG 2.1 calculé comme le fait la norme (luminance relative).
 *    Seuils : 4,5:1 pour du texte, 3:1 pour un contour ou une forme.
 *    On vérifie les PAIRES réellement utilisées ensemble, pas les couleurs seules.
 */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [clair, fonce] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (clair + 0.05) / (fonce + 0.05);
}

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
    ['message d’erreur', Theme.feedback.erreurTexte, Theme.feedback.erreurSurface],
    ['erreur sur la surface', Theme.feedback.erreurTexte, Theme.fond.surface],
    ['initiale de l’avatar', Theme.marque.principal, Theme.marque.doux],
    ['texte sur la couleur signature', Theme.accent.signatureTexte, Theme.accent.signatureAplat],
  ])('texte — %s ≥ 4,5:1', (_nom, texte, fond) => {
    expect(contraste(texte, fond)).toBeGreaterThanOrEqual(TEXTE);
  });

  it.each([
    ['contour d’un champ', Theme.formulaire.bordure, Theme.fond.surface],
    ['contour au focus', Theme.formulaire.focus, Theme.fond.surface],
    ['contour du bouton secondaire', Theme.action.secondaireBordure, Theme.fond.surface],
    ['jauge « critique »', Theme.etat.critique.jauge, Theme.fond.surface],
    ['icône d’information', Theme.info.icone, Theme.info.fond],
  ])('contour — %s ≥ 3:1', (_nom, contour, fond) => {
    expect(contraste(contour, fond)).toBeGreaterThanOrEqual(CONTOUR);
  });
});