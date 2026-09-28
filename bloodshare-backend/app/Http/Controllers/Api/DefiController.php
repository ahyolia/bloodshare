<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Defi;
use App\Models\Don;
use App\Models\UserDefi;
use Illuminate\Http\Request;

class DefiController extends Controller
{
    public function actuel(Request $request)
    {
        // 📖 Le défi affiché est le dernier actif OU terminé (pour continuer à montrer le
        //    résultat juste après qu'il ait été remporté), sinon le dernier tout court —
        //    plutôt qu'uniquement statut='actif', qui ferait disparaître le défi de l'écran
        //    à l'instant même où son objectif est atteint.
        $defi = Defi::whereIn('statut', ['actif', 'termine'])
            ->orderByDesc('updated_at')
            ->first();

        if (! $defi) {
            return response('null', 200)->header('Content-Type', 'application/json');
        }

        $progression = Don::where('statut', 'valide')
            ->whereMonth('date_don', now()->month)
            ->whereYear('date_don', now()->year)
            ->count();

        $maProgression = UserDefi::where('user_id', $request->user()->id)
            ->where('defi_id', $defi->id)
            ->value('progression') ?? 0;

        return response()->json([
            'id' => $defi->id,
            'titre' => $defi->titre,
            'description' => $defi->description,
            'objectif_chiffre' => $defi->objectif_chiffre,
            'progression_actuelle' => $progression,
            'ma_progression' => $maProgression,
            'points_attribues' => $defi->points_attribues,
            'statut' => $defi->statut,
            'date_fin' => $defi->date_fin,
        ]);
    }
}
