<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NiveauService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ProfilController extends Controller
{
    public function show(Request $request)
    {
        return response()->json($this->formatUser($request->user()));
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'pseudo' => 'nullable|string|max:50|unique:users,pseudo,' . $user->id,
            'avatar_id' => 'nullable|exists:avatars,id',
        ]);

        $user->update(array_filter($validated, fn ($value) => $value !== null));

        return response()->json($this->formatUser($user->fresh()));
    }

    public function destroy(Request $request)
    {
        $user = $request->user();

        $user->tokens()->delete();

        // 📖 RGPD : la ligne reste en base (dons, points, badges... gardent leur historique
        //    pour les statistiques de l'association), mais tout ce qui identifie la personne
        //    est effacé. `email` doit rester unique et non nul en base, d'où le suffixe id.
        //    `password` est réécrit avec une valeur aléatoire : même si `login()` refuse déjà
        //    les comptes `statut='supprime'`, un compte ne doit plus être utilisable si cette
        //    règle venait à changer un jour.
        $user->update([
            'statut' => 'supprime',
            'pseudo' => 'Utilisateur supprimé',
            'email' => "supprime-{$user->id}@bloodshare.local",
            'password' => Hash::make(Str::random(40)),
            'avatar_id' => null,
            'code_parrainage' => null,
        ]);

        return response()->json([
            'message' => 'Compte supprimé avec succès.',
        ]);
    }

    private function formatUser($user): array
    {
        return [
            'id' => $user->id,
            'pseudo' => $user->pseudo,
            'avatar_url' => null,
            'statut_donneur' => $user->statut_donneur,
            'sexe' => $user->sexe,
            'points_cumules' => $user->points_cumules,
            'niveau' => NiveauService::calculerNiveau($user->points_cumules ?? 0),
            'code_parrainage' => $user->code_parrainage,
            'statut' => $user->statut,
            'created_at' => $user->created_at,
            'derniere_connexion' => $user->derniere_connexion,
        ];
    }
}
