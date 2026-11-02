import { usePathname } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getBadgesAFeter, marquerBadgeFete, type BadgeAFeter } from '../services/badges.service';

// Laisse l'écran d'arrivée s'afficher (et son appel API aboutir) avant de vérifier.
const DELAI_VERIFICATION = 800;

/** Écrans où le popup attend qu'on soit parti (ils ont leur propre animation de fête). */
const PAGES_SANS_POPUP = ['/tabs/don/resultat-scan'];

// 📖 File des badges à fêter. On vérifie à chaque changement d'écran et au retour au
//    premier plan : un badge gagné au scan, à la fin d'un quiz ou par le parrainage d'un
//    filleul apparaît donc dès l'écran suivant. Les badges passent un par un ; fermer
//    le popup marque le badge comme fêté côté serveur.
export function useBadgesAFeter() {
  const pathname = usePathname();
  const [file, setFile] = useState<BadgeAFeter[]>([]);
  const enCours = useRef(false);
  // Badges fermés dans cette session : ne pas les reprendre si une vérification part
  // avant que le serveur ait enregistré la lecture.
  const dejaFetes = useRef(new Set<string>());

  const verifier = useCallback(async () => {
    if (enCours.current) return;
    enCours.current = true;
    try {
      const badges = (await getBadgesAFeter()).filter((b) => !dejaFetes.current.has(b.notificationId));
      if (badges.length > 0) {
        setFile((actuelle) => {
          const dejaLa = new Set(actuelle.map((b) => b.notificationId));
          return [...actuelle, ...badges.filter((b) => !dejaLa.has(b.notificationId))];
        });
      }
    } catch {
      // Pas de réseau ou session expirée : on réessaiera au prochain écran.
    } finally {
      enCours.current = false;
    }
  }, []);

  useEffect(() => {
    const minuteur = setTimeout(verifier, DELAI_VERIFICATION);
    return () => clearTimeout(minuteur);
  }, [pathname, verifier]);

  useEffect(() => {
    const abonnement = AppState.addEventListener('change', (etat) => {
      if (etat === 'active') verifier();
    });
    return () => abonnement.remove();
  }, [verifier]);

  const fermer = useCallback(() => {
    const premier = file[0];
    if (!premier) return;
    dejaFetes.current.add(premier.notificationId);
    // Échec silencieux : au pire, le popup reviendra au prochain lancement.
    marquerBadgeFete(premier).catch(() => {});
    setFile((actuelle) => actuelle.slice(1));
  }, [file]);

  // 📖 Pendant la mise en scène de l'obtention d'une carte, le popup attend : deux
  //    animations de fête l'une sur l'autre se gâcheraient. Le badge reste dans la file
  //    et s'affiche dès qu'on quitte l'écran (« Voir ma collection », accueil…).
  const enPause = PAGES_SANS_POPUP.includes(pathname);

  return { badge: enPause ? null : (file[0] ?? null), fermer };
}
