export const Colors = {
  corail: {
    500: '#F07A5E',
    600: '#D6543A',
  },
  petrole: {
    500: '#2E93A0',
    600: '#136B7A',
  },
  lime: '#C6DA2C',
  creme: '#F6F1E4',
  cremeClair: '#FFFDF7',
  blanc: '#FFFFFF',
  aubergine: '#3E2430',
  grisMoyen: '#6A5560',
  succes: '#6E9B3E',
  attention: '#F0A03C',
  deconnexion: {
    500: '#d92c2c',
    600: '#b32626',
  },
  fondNeutre: '#F0EDEE',
  fondRose: '#FFE8E4',
  fondBleu: '#E4F3F5',
  fondVert: '#E8F4E8',
  fondOrange: '#FFF0E4',
  fondGris: '#E8E4E6',
  fondGrisClair: '#FAFAFA',
  // 📖 Couleurs sémantiques des niveaux de stock de sang (partagées BO / mobile).
  //    Certaines recoupent des tokens existants (bas ≈ attention, correct ≈ petrole[500],
  //    bon ≈ succes) mais on les nomme explicitement : le sens « niveau de stock »
  //    doit rester indépendant des autres usages de ces teintes.
  status: {
    critique: '#D8452C',
    bas: '#F0A03C',
    correct: '#2E93A0',
    bon: '#6E9B3E',
  },
};
