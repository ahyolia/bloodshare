// 📖 Typographie française : l'espace avant « ? ! : ; » et à l'intérieur des guillemets
//    « » doit être insécable, sinon la ponctuation peut se retrouver seule en début de
//    ligne (« Qui peut donner » / « ? »). Espace insécable classique (U+00A0) plutôt que
//    fine (U+202F) : toutes les polices de l'app l'ont, sur Android comme sur le web.
export const ESPACE_INSECABLE = ' ';

export const avecEspacesInsecables = (texte: string): string =>
  texte
    .replace(/ +([?!:;»])/g, `${ESPACE_INSECABLE}$1`)
    .replace(/« +/g, `«${ESPACE_INSECABLE}`);

// 📖 Champs saisis par l'utilisateur : rendus tels quels. Le formulaire de profil
//    préremplit le pseudo depuis l'API, une version corrigée serait renvoyée et
//    enregistrée en base avec des espaces insécables qu'il n'a jamais tapées.
const CHAMPS_SAISIS = new Set(['pseudo', 'email']);

/** Applique `avecEspacesInsecables` à toutes les chaînes d'une réponse de l'API, sauf aux champs saisis. */
export const espacesInsecablesPartout = <T>(valeur: T): T => {
  if (typeof valeur === 'string') return avecEspacesInsecables(valeur) as T;
  if (Array.isArray(valeur)) return valeur.map(espacesInsecablesPartout) as T;
  if (valeur && typeof valeur === 'object') {
    return Object.fromEntries(
      Object.entries(valeur).map(([cle, v]) => [cle, CHAMPS_SAISIS.has(cle) ? v : espacesInsecablesPartout(v)])
    ) as T;
  }
  return valeur;
};
