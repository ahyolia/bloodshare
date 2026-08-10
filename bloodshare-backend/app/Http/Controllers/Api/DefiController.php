<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Defi;
use App\Models\Don;

class DefiController extends Controller
{
    public function actuel()
    {
        $defi = Defi::where('statut', 'actif')->first();

        if (! $defi) {
            return response('null', 200)->header('Content-Type', 'application/json');
        }

        $progression = Don::where('statut', 'valide')
            ->whereMonth('date_don', now()->month)
            ->whereYear('date_don', now()->year)
            ->count();

        return response()->json([
            'id' => $defi->id,
            'titre' => $defi->titre,
            'description' => $defi->description,
            'objectif_chiffre' => $defi->objectif_chiffre,
            'progression_actuelle' => $progression,
            'points_attribues' => $defi->points_attribues,
            'date_fin' => $defi->date_fin ?? null,
        ]);
    }
}
