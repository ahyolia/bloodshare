<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentJuridique;
use App\Models\Parrainage;
use App\Models\User;
use App\Notifications\FilleulInscritNotification;
use App\Services\BadgeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        // 📖 Les codes de parrainage sont générés en majuscules : on tolère qu'ils soient
        //    saisis en minuscules à la main.
        if ($request->filled('code_parrainage')) {
            $request->merge(['code_parrainage' => strtoupper(trim($request->input('code_parrainage')))]);
        }

        // 📖 email n'est pas en citext côté PostgreSQL : sans normalisation,
        //    "Test@example.test" et "test@example.test" passeraient la contrainte unique
        //    comme deux comptes distincts, alors que c'est la même adresse. Le pseudo,
        //    lui, garde la casse saisie : c'est un nom affiché, pas un identifiant technique.
        if ($request->filled('email')) {
            $request->merge(['email' => mb_strtolower(trim($request->input('email')))]);
        }

        // 📖 Un espace en fin de pseudo saisi au clavier mobile créerait un compte
        //    visuellement identique mais distinct en base (unicité stricte sur la chaîne).
        if ($request->filled('pseudo')) {
            $request->merge(['pseudo' => trim($request->input('pseudo'))]);
        }

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
            'avatar_id' => 'nullable|exists:avatars,id',
            // Un code inconnu était ignoré en silence (inscription réussie, aucun parrainage
            // créé) : l'utilisateur croyait son code pris en compte. On refuse désormais.
            'code_parrainage' => 'nullable|string|exists:users,code_parrainage',
            // 📖 Consentements (voir docs/Dossier juridique) : vérifiés ici et pas seulement
            //    côté mobile, sinon un appel direct à l'API créerait un compte sans eux.
            'cgu_acceptees' => 'accepted',
            'confidentialite_acceptee' => 'accepted',
            'consentement_sante' => 'accepted',
            'majeur' => 'accepted',
        ], [
            'code_parrainage.exists' => "Ce code de parrainage n'existe pas. Vérifie-le ou laisse le champ vide.",
            'cgu_acceptees.accepted' => "Tu dois accepter les conditions générales d'utilisation.",
            'confidentialite_acceptee.accepted' => 'Tu dois accepter la politique de confidentialité.',
            'consentement_sante.accepted' => "Ce consentement est nécessaire pour suivre tes dons et te prévenir quand tu peux redonner.",
            'majeur.accepted' => "L'application est réservée aux personnes majeures.",
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
            'avatar_id' => $validated['avatar_id'] ?? null,
            'code_parrainage' => $codeParrainage,
        ]);

        // 📖 forceFill : ces champs ne doivent jamais être modifiables par une mise à jour de
        //    profil (PUT /me), donc ils restent hors de $fillable.
        $user->forceFill([
            // 📖 Version lue dans le document du BO (documents_juridiques), celle que le
            //    super_admin fait évoluer : c'est elle que l'utilisateur a sous les yeux.
            'cgu_version' => DocumentJuridique::where('type', 'cgu')->value('version'),
            'cgu_acceptees_at' => now(),
            'consentement_sante_at' => now(),
        ])->save();

        if (!empty($validated['code_parrainage'])) {
            $parrain = User::where('code_parrainage', $validated['code_parrainage'])->first();

            // 📖 Impossible à l'inscription (le compte $user vient d'être créé, son propre
            //    code_parrainage ne peut pas déjà exister ailleurs) : garde défensive si ce
            //    bloc est un jour réutilisé pour un rattachement a posteriori.
            if ($parrain && $parrain->id !== $user->id) {
                Parrainage::create([
                    'parrain_id' => $parrain->id,
                    'filleul_id' => $user->id,
                    'statut' => 'en_attente',
                ]);

                // 📖 « Bien accueilli » récompense le fait de s'inscrire avec un code, pas la
                //    validation du parrainage (qui arrive plus tard, au 1er don) : on l'attribue
                //    donc tout de suite, sans attendre un scan.
                app(BadgeService::class)->synchroniser($user);

                $parrain->notify(new FilleulInscritNotification());
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

        // 📖 email est stocké en minuscules depuis l'inscription (voir register) : sans
        //    cette normalisation ici aussi, se connecter avec une casse différente de celle
        //    saisie à l'inscription échouerait alors que c'est la même adresse.
        $request->merge(['email' => mb_strtolower(trim($request->input('email')))]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Email ou mot de passe incorrect.',
            ], 401);
        }

        $user = User::where('email', $request->email)->first();

        // 📖 Le contrôle statut === 'supprime' qui vivait ici (PR #64) est devenu du code
        //    mort depuis l'anonymisation RGPD : DELETE /me remplace désormais l'email par une
        //    valeur générée (supprime-{id}@bloodshare.local), donc plus aucune requête de login
        //    ne peut retrouver ce compte par son ancien email — Auth::attempt aurait déjà
        //    échoué avant d'arriver ici. Retiré (revue @nevizsh sur la PR RGPD).

        // 📖 Un compte suspendu, lui, garde son email : sans ce contrôle, il obtenait un
        //    nouveau token à chaque connexion.
        if ($user->statut === 'suspendu') {
            return response()->json([
                'message' => "Ton compte est suspendu. Contacte l'association pour en savoir plus.",
            ], 403);
        }

        // 📖 L'app est réservée aux donneurs : un compte du backoffice qui s'y connecte
        //    obtiendrait un token mobile en plus de sa session BO, pour rien.
        if ($user->estCompteBackoffice()) {
            return response()->json([
                'message' => "Ce compte sert au backoffice : connecte-toi sur le site d'administration. "
                    . "Pour utiliser l'app, crée un compte donneur.",
            ], 403);
        }

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

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'pseudo' => $user->pseudo,
            'avatar_id' => $user->avatar_id,
            'avatar_url' => null,
            'points_cumules' => $user->points_cumules,
            'code_parrainage' => $user->code_parrainage,
            'doit_changer_mdp' => $user->doit_changer_mdp,
        ];
    }
}
