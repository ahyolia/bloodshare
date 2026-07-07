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

        $carteEvenement = $cartes->firstWhere('categorie', 'evenement');
        $carteParrain = $cartes->firstWhere('categorie', 'parrain');
        $carteFilleul = $cartes->firstWhere('categorie', 'filleul');

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
                'carte' => $carteEvenement ? [
                    'id' => $carteEvenement->id,
                    'titre' => $carteEvenement->titre,
                    'image_url' => $carteEvenement->image_url,
                    'obtenue' => $userCartes->has($carteEvenement->id),
                    'quantite' => $userCartes->get($carteEvenement->id)?->quantite ?? 0,
                ] : null,
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
        ]);
    }
}
