<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Carte;
use App\Models\UserCarte;
use Illuminate\Http\Request;

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

        return response()->json([
            'mois_don' => [
                'pourcentage_complete' => round($moisDonObtenues->count() / 12 * 100, 1),
                'cartes' => $moisDon->map(fn ($carte) => [
                    'id' => $carte->id,
                    'titre' => $carte->titre,
                    'mois_numero' => $carte->mois_numero,
                    'image_url' => $carte->image_url,
                    'obtenue' => $userCartes->has($carte->id),
                ])->values(),
            ],
            'evenement' => [
                'cartes' => $cartesEvenement->map(fn ($carte) => [
                    'id' => $carte->id,
                    'titre' => $carte->titre,
                    'image_url' => $carte->image_url,
                    'obtenue' => $userCartes->has($carte->id),
                    'quantite' => $userCartes->get($carte->id)?->quantite ?? 0,
                ])->values(),
            ],
            'parrainage' => [
                'carte_parrain' => $carteParrain ? [
                    'id' => $carteParrain->id,
                    'titre' => $carteParrain->titre,
                    'image_url' => $carteParrain->image_url,
                    'obtenue' => $userCartes->has($carteParrain->id),
                    'quantite' => $userCartes->get($carteParrain->id)?->quantite ?? 0,
                ] : null,
                'carte_filleul' => $carteFilleul ? [
                    'id' => $carteFilleul->id,
                    'titre' => $carteFilleul->titre,
                    'image_url' => $carteFilleul->image_url,
                    'obtenue' => $userCartes->has($carteFilleul->id),
                    'quantite' => $userCartes->get($carteFilleul->id)?->quantite ?? 0,
                ] : null,
            ],
            'fidelite' => [
                'carte' => $carteFidele ? [
                    'id' => $carteFidele->id,
                    'titre' => $carteFidele->titre,
                    'image_url' => $carteFidele->image_url,
                    'obtenue' => $userCartes->has($carteFidele->id),
                    'quantite' => $userCartes->get($carteFidele->id)?->quantite ?? 0,
                ] : null,
            ],
        ]);
    }
}
