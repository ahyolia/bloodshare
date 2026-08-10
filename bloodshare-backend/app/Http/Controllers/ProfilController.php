<?php

namespace App\Http\Controllers;

use App\Services\NiveauService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfilController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'id'                 => $user->id,
            'pseudo'             => $user->pseudo,
            'avatar_url'         => $user->avatar?->image_url,
            'sexe'               => $user->sexe,
            'statut_donneur'     => $user->statut_donneur,
            'points_cumules'     => $user->points_cumules,
            'niveau'             => NiveauService::calculerNiveau($user->points_cumules ?? 0),
            'code_parrainage'    => $user->code_parrainage,
            'statut'             => $user->statut,
            'created_at'         => $user->created_at,
            'derniere_connexion' => $user->derniere_connexion,
        ]);
    }
}
