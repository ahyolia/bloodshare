<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Carte;
use App\Models\UserCarte;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class CarteController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $cartes = Carte::where('statut', 'active')->get();

        $userCartes = UserCarte::where('user_id', $user->id)
            ->get()
            ->keyBy('carte_id');

        // 📖 Une collection de cartes de mois par année : celle de l'année en cours, plus les
        //    années passées où le donneur a au moins une carte (une collection future, créée
        //    en décembre pour y poser les dessins, reste cachée). La plus récente d'abord.
        $anneeCourante = now()->year;
        $collections = $cartes->where('categorie', 'mois_don')
            ->where('annee', '<=', $anneeCourante)
            ->groupBy('annee')
            ->filter(fn (Collection $cartesAnnee, $annee) => (int) $annee === $anneeCourante
                || $cartesAnnee->contains(fn (Carte $carte) => $userCartes->has($carte->id)))
            ->sortKeysDesc()
            ->map(fn (Collection $cartesAnnee, $annee) => $this->collectionMois((int) $annee, $cartesAnnee, $userCartes))
            ->values();
        $collectionCourante = $collections->firstWhere('annee', $anneeCourante)
            ?? ['pourcentage_complete' => 0, 'cartes' => collect()];

        // 📖 Toutes les cartes Événement : la générique et celles propres à un événement
        //    (forum IUT...). La générique en premier.
        $cartesEvenement = $cartes->where('categorie', 'evenement')
            ->sortBy([['generique', 'desc'], ['id', 'asc']])
            ->values();
        $carteParrain = $cartes->firstWhere('categorie', 'parrain');
        $carteFilleul = $cartes->firstWhere('categorie', 'filleul');
        $carteFidele = $cartes->firstWhere('categorie', 'fidele');

        // Cartes qu'on peut obtenir plusieurs fois : le nombre d'exemplaires en plus.
        $avecQuantite = fn (Carte $carte) => $this->carte($carte, $userCartes) + [
            'quantite' => $userCartes->get($carte->id)?->quantite ?? 0,
        ];

        return response()->json([
            // 📖 `cartes` et `pourcentage_complete` : la collection de l'année en cours, comme
            //    avant les collections par année (une app pas encore à jour reste correcte).
            'mois_don' => [
                'annee' => $anneeCourante,
                'pourcentage_complete' => $collectionCourante['pourcentage_complete'],
                'cartes' => $collectionCourante['cartes'],
                'collections' => $collections,
            ],
            'evenement' => [
                'cartes' => $cartesEvenement->map($avecQuantite)->values(),
            ],
            'parrainage' => [
                'carte_parrain' => $carteParrain ? $avecQuantite($carteParrain) : null,
                'carte_filleul' => $carteFilleul ? $avecQuantite($carteFilleul) : null,
            ],
            'fidelite' => [
                'carte' => $carteFidele ? $avecQuantite($carteFidele) : null,
            ],
        ]);
    }

    /**
     * 📖 Janvier → décembre : sans tri, PostgreSQL renvoie l'ordre physique des lignes, qui
     *    change dès qu'une carte est modifiée (image posée depuis le BO...).
     */
    private function collectionMois(int $annee, Collection $cartes, Collection $userCartes): array
    {
        $obtenues = $cartes->filter(fn (Carte $carte) => $userCartes->has($carte->id))->count();

        return [
            'annee' => $annee,
            'pourcentage_complete' => round($obtenues / 12 * 100, 1),
            'cartes' => $cartes->sortBy('mois_numero')
                ->map(fn (Carte $carte) => $this->carte($carte, $userCartes) + [
                    'mois_numero' => $carte->mois_numero,
                    'annee' => $carte->annee,
                ])
                ->values(),
        ];
    }

    /**
     * Champs communs à toutes les cartes.
     *
     * 📖 `obtenue_le` : jour seulement (pas l'heure), affiché sur la carte en grand
     *    (« Obtenue le 12 novembre 2026 »). Uniquement la date de sa propre carte, rien
     *    sur le don lui-même. null tant que la carte n'est pas obtenue.
     */
    private function carte(Carte $carte, Collection $userCartes): array
    {
        $userCarte = $userCartes->get($carte->id);

        return [
            'id' => $carte->id,
            'titre' => $carte->titre,
            'description' => $carte->description,
            'image_url' => $carte->image_url,
            'obtenue' => $userCarte !== null,
            'obtenue_le' => $userCarte?->obtenue_at?->toDateString(),
        ];
    }
}
