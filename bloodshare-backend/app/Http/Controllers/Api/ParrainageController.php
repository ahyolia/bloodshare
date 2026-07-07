<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Parrainage;
use Illuminate\Http\Request;

class ParrainageController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $nbParrainagesValides = Parrainage::where('parrain_id', $user->id)
            ->where('statut', 'valide')
            ->count();

        return response()->json([
            'code' => $user->code_parrainage,
            'nb_parrainages_valides' => $nbParrainagesValides,
        ]);
    }
}
