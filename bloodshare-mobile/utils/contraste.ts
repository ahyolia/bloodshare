/**
 * Rapport de contraste WCAG 2.1 entre deux couleurs « #RRGGBB ».
 * Seuils AA : 4,5:1 pour du texte, 3:1 pour une icône, un contour ou une forme.
 * 📖 Utilisé par les tests pour vérifier les PAIRES de couleurs réellement
 *    affichées ensemble.
 */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contraste(a: string, b: string): number {
  const [clair, fonce] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (clair + 0.05) / (fonce + 0.05);
}