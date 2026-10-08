<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NiveauService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

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

    public function changerMotDePasse(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'mot_de_passe_actuel' => 'required|string',
            'password' => [
                'required',
                'confirmed',
                PasswordRule::min(8)->mixedCase()->numbers(),
            ],
        ]);

        if (! Hash::check($validated['mot_de_passe_actuel'], $user->password)) {
            throw ValidationException::withMessages([
                'mot_de_passe_actuel' => 'Mot de passe actuel incorrect.',
            ]);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
            'doit_changer_mdp' => false,
        ]);

        return response()->json([
            'message' => 'Mot de passe mis à jour.',
        ]);
    }

    public function destroy(Request $request)
    {
        $user = $request->user();

        $user->tokens()->delete();

        $user->anonymiser();

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
            'doit_changer_mdp' => $user->doit_changer_mdp,
            'created_at' => $user->created_at,
            'derniere_connexion' => $user->derniere_connexion,
        ];
    }
}
