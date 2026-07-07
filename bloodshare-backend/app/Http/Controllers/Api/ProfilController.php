<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

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
        $user->update(['statut' => 'supprime']);

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
            'groupe_sanguin' => $user->groupe_sanguin,
            'sexe' => $user->sexe,
            'points_cumules' => $user->points_cumules,
            'code_parrainage' => $user->code_parrainage,
            'statut' => $user->statut,
            'created_at' => $user->created_at,
            'derniere_connexion' => $user->derniere_connexion,
        ];
    }
}
