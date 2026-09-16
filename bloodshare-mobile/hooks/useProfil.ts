import { useEffect, useState } from 'react';
import { getProfil, Profil } from '../services/profil.service';

// 📖 Récupère le profil gamifié (pseudo, points cumulés, niveau) via GET /me.
// → Pourquoi un hook dédié : le header applicatif ET plusieurs écrans ont besoin
//   des mêmes données ; on centralise le chargement / la gestion d'erreur ici
//   plutôt que de recopier le même useEffect dans chaque écran.
export function useProfil() {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getProfil()
      .then((data) => {
        if (!cancelled) setProfil(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { profil, loading, error };
}
