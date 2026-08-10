<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserCarte;
use Illuminate\Http\Request;

class DonController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $dons = $user->dons()
            ->with('scan.qrCode')
            ->orderBy('date_don', 'desc')
            ->get();

        $data = $dons->map(function ($don) use ($user) {
            $carteObtenue = UserCarte::where('user_id', $user->id)
                ->whereBetween('obtenue_at', [
                    $don->date_don->copy()->subMinute(),
                    $don->date_don->copy()->addMinute(),
                ])
                ->with('carte')
                ->first();

            return [
                'id' => $don->id,
                'date_don' => $don->date_don,
                'type' => $don->scan?->qrCode?->type,
                'carte_obtenue' => $carteObtenue ? [
                    'id' => $carteObtenue->carte->id,
                    'titre' => $carteObtenue->carte->titre,
                    'categorie' => $carteObtenue->carte->categorie,
                ] : null,
            ];
        });

        return response()->json([
            'data' => $data,
            'total_dons' => $dons->count(),
        ]);
    }
}
