import { useCallback, useEffect, useState } from 'react';
import { getBadgesResume, BadgesResume } from '../services/badges.service';
import { getDons, DonsReponse } from '../services/dons.service';
import { getProfil, Profil } from '../services/profil.service';
import { getUser, saveUser } from '../stores/auth.store';

// 📖 Aperçu = sous-ensemble du profil déjà connu hors-ligne (rangé dans le
//    SecureStore au login / à la dernière sync). Sert à peindre la carte
//    utilisateur AVANT la réponse réseau : l'écran n'est jamais vide.
type Apercu = {
  pseudo: string;
  avatar_url: string | null;
  points_cumules: number;
};

// 📖 Un seul hook pour l'écran Profil : il orchestre les 3 appels du montage
//    (/me, /dons, /badges) en parallèle et centralise loading / error / reload.
//    Pourquoi Promise.all et pas 3 `await` à la suite : les 3 requêtes sont
//    indépendantes. En séquentiel, on paie 3 allers-retours bout à bout
//    (~300  + 300 + 300 ms). En parallèle, on paie le plus lent des trois
//    (~300 ms). Promise.all lance tout de suite et attend le dernier ; il
//    rejette dès qu'UNE requête échoue (d'où le try/catch global).
export function useProfilComplet() {
  const [apercu, setApercu] = useState<Apercu | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [dons, setDons] = useState<DonsReponse | null>(null);
  const [badges, setBadges] = useState<BadgesResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const charger = useCallback(async () => {
    setError(false);

    // 1. Cache local d'abord → affichage immédiat du pseudo / des points connus.
    const cache = await getUser();
    if (cache) {
      setApercu({
        pseudo: cache.pseudo,
        avatar_url: cache.avatar_url ?? null,
        points_cumules: cache.points_cumules ?? 0,
      });
    }

    // 2. Données fraîches, en parallèle.
    try {
      const [meData, donsData, badgesData] = await Promise.all([
        getProfil(),
        getDons(),
        getBadgesResume(),
      ]);

      setProfil(meData);
      setDons(donsData);
      setBadges(badgesData);

      // 3. On rafraîchit le cache pour le prochain démarrage / l'AppHeader.
      await saveUser({
        ...(cache ?? {}),
        pseudo: meData.pseudo,
        avatar_url: meData.avatar_url,
        statut_donneur: meData.statut_donneur,
        points_cumules: meData.points_cumules,
        code_parrainage: meData.code_parrainage,
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  return { apercu, profil, dons, badges, loading, error, reload: charger };
}
