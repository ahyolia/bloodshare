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

        $moisDon = $cartes->where('categorie', 'mois_don')->values();
        $moisDonObtenues = $moisDon->filter(fn ($carte) => $userCartes->has($carte->id));

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
            'mois_don' => [
                'pourcentage_complete' => round($moisDonObtenues->count() / 12 * 100, 1),
                'cartes' => $moisDon->map(fn ($carte) => $this->carte($carte, $userCartes) + [
                    'mois_numero' => $carte->mois_numero,
                ])->values(),
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
