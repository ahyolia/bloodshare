<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Parrainage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'pseudo' => 'required|string|max:50|unique:users,pseudo',
            'email' => 'required|email|unique:users,email',
            'password' => [
                'required',
                'confirmed',
                PasswordRule::min(8)
                    ->mixedCase()
                    ->numbers(),
            ],
            'sexe' => 'required|in:homme,femme',
            'statut_donneur' => 'nullable|in:donneur_regulier,quelques_dons,jamais_donne',
            'avatar_id' => 'nullable|exists:avatars,id',
            'code_parrainage' => 'nullable|string',
        ]);

        $codeParrainage = strtoupper(Str::random(8));
        while (User::where('code_parrainage', $codeParrainage)->exists()) {
            $codeParrainage = strtoupper(Str::random(8));
        }

        $user = User::create([
            'pseudo' => $validated['pseudo'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'sexe' => $validated['sexe'],
            'statut_donneur' => $validated['statut_donneur'] ?? null,
            'avatar_id' => $validated['avatar_id'] ?? null,
            'code_parrainage' => $codeParrainage,
        ]);

        if (!empty($validated['code_parrainage'])) {
            $parrain = User::where('code_parrainage', $validated['code_parrainage'])->first();

            if ($parrain) {
                Parrainage::create([
                    'parrain_id' => $parrain->id,
                    'filleul_id' => $user->id,
                    'statut' => 'en_attente',
                ]);
            }
        }

        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->formatUser($user->fresh()),
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Email ou mot de passe incorrect.',
            ], 401);
        }

        $user = User::where('email', $request->email)->first();
        $user->update(['derniere_connexion' => now()]);

        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->formatUser($user),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie.',
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required',
        ]);

        Password::sendResetLink($request->only('email'));

        return response()->json([
            'message' => 'Email de réinitialisation envoyé.',
        ]);
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'pseudo' => $user->pseudo,
            'avatar_url' => null,
            'statut_donneur' => $user->statut_donneur,
            'points_cumules' => $user->points_cumules,
            'code_parrainage' => $user->code_parrainage,
        ];
    }
}
