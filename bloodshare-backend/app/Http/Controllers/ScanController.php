<?php

namespace App\Http\Controllers;

use App\Models\Carte;
use App\Models\Don;
use App\Models\QrCode;
use App\Models\QrCodeScan;
use App\Models\UserCarte;
use App\Services\BadgeService;
use App\Services\ParrainageService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScanController extends Controller
{
    public function scan(Request $request): JsonResponse
    {
        $request->validate(['token' => 'required|string']);

        $qrCode = QrCode::where('token', $request->token)
            ->where('actif', true)
            ->first();

        if (! $qrCode) {
            return response()->json(['message' => 'QR Code invalide ou expiré.'], 404);
        }

        $user = $request->user();

        return DB::transaction(function () use ($user, $qrCode) {
            $scan = QrCodeScan::create([
                'user_id'    => $user->id,
                'qr_code_id' => $qrCode->id,
                'scanned_at' => now(),
            ]);

            return match ($qrCode->type) {
                'centre'    => $this->handleDon($user, $scan),
                'evenement' => $this->handleEvenement($user, $scan, $qrCode),
                default     => response()->json(['message' => 'Type de QR Code non supporté.'], 422),
            };
        });
    }

    private function handleDon($user, QrCodeScan $scan): JsonResponse
    {
        // Délai d'éligibilité selon le sexe : 56j (homme) / 84j (femme)
        $delaiJours = $user->sexe === 'femme' ? 84 : 56;

        $dernierDon = Don::where('user_id', $user->id)
            ->where('statut', 'valide')
            ->orderByDesc('date_don')
            ->first();

        if ($dernierDon && $dernierDon->date_don->addDays($delaiJours)->isFuture()) {
            return response()->json([
                'message'               => 'Vous n\'êtes pas encore éligible pour donner.',
                'prochaine_eligibilite' => $dernierDon->date_don->addDays($delaiJours)->toDateString(),
            ], 422);
        }

        // Carte du mois courant
        $moisNumero = (int) now()->format('n');
        $carte      = Carte::where('categorie', 'mois_don')
            ->where('mois_numero', $moisNumero)
            ->where('statut', 'active')
            ->first();

        if (! $carte) {
            return response()->json([
                'message' => 'La carte du mois n\'est pas encore disponible. Contactez un administrateur.',
            ], 503);
        }

        // Enregistrement du don
        Don::create([
            'user_id'  => $user->id,
            'scan_id'  => $scan->id,
            'date_don' => now(),
            'statut'   => 'valide',
        ]);

        $carteObtenue = null;
        if ($carte) {
            $userCarte = UserCarte::where('user_id', $user->id)
                ->where('carte_id', $carte->id)
                ->first();

            $dejaPossedee = (bool) $userCarte;

            if (! $userCarte) {
                // 📖 Deux scans concurrents du même don (double-tap, retry réseau) pourraient
                //    tous deux passer ce `if (! $userCarte)` avant qu'aucun n'ait écrit : la
                //    contrainte unique (user_id, carte_id) — migration
                //    add_unique_constraint_to_user_cartes_table — fait respecter la règle au
                //    niveau base. Un doublon veut juste dire que l'autre requête a gagné la
                //    course ; la carte est déjà possédée, rien d'autre à faire.
                try {
                    UserCarte::create([
                        'user_id'    => $user->id,
                        'carte_id'   => $carte->id,
                        'quantite'   => 1,
                        'obtenue_at' => now(),
                    ]);
                } catch (QueryException $e) {
                    if (! str_contains($e->getMessage(), 'user_cartes_user_id_carte_id_unique')) {
                        throw $e;
                    }

                    $dejaPossedee = true;
                }
            }

            $carteObtenue = [
                'id'           => $carte->id,
                'titre'        => $carte->titre,
                'categorie'    => $carte->categorie,
                'mois_numero'  => $carte->mois_numero,
                'image_url'    => $carte->image_url,
                'deja_possedee' => $dejaPossedee,
            ];
        }

        app(ParrainageService::class)->validerSiFilleul($user);

        $badges = app(BadgeService::class)->synchroniser($user);

        return response()->json([
            'type'             => 'don',
            'carte_obtenue'    => $carteObtenue,
            'badges_debloques' => $badges,
        ]);
    }

    private function handleEvenement($user, QrCodeScan $scan, QrCode $qrCode): JsonResponse
    {
        // Carte générique événement (la première active trouvée)
        $carte = Carte::where('categorie', 'evenement')
            ->where('statut', 'active')
            ->first();

        $quantite = 1;
        if ($carte) {
            $userCarte = UserCarte::where('user_id', $user->id)
                ->where('carte_id', $carte->id)
                ->first();

            if ($userCarte) {
                $userCarte->increment('quantite');
                $quantite = $userCarte->fresh()->quantite;
            } else {
                // 📖 Même protection que dans handleDon : voir le commentaire là-bas.
                try {
                    UserCarte::create([
                        'user_id'    => $user->id,
                        'carte_id'   => $carte->id,
                        'quantite'   => 1,
                        'obtenue_at' => now(),
                    ]);
                } catch (QueryException $e) {
                    if (! str_contains($e->getMessage(), 'user_cartes_user_id_carte_id_unique')) {
                        throw $e;
                    }

                    // L'autre requête a créé la ligne la première : on incrémente celle-là.
                    UserCarte::where('user_id', $user->id)
                        ->where('carte_id', $carte->id)
                        ->increment('quantite');
                    $quantite = UserCarte::where('user_id', $user->id)
                        ->where('carte_id', $carte->id)
                        ->value('quantite');
                }
            }
        }

        $evenement = $qrCode->evenement;

        // 📖 Manquait ici (contrairement à handleDon) : « Toujours partant » (3 cartes
        //    événement) était bien attribué en base par BadgeService lu depuis GET /badges,
        //    mais jamais annoncé dans la réponse du scan — pas de popup au bon moment.
        $badges = app(BadgeService::class)->synchroniser($user);

        return response()->json([
            'type'             => 'evenement',
            'evenement'        => $evenement ? ['id' => $evenement->id, 'titre' => $evenement->titre] : null,
            'carte_obtenue'    => $carte ? [
                'id'        => $carte->id,
                'titre'     => $carte->titre,
                'categorie' => $carte->categorie,
                'image_url' => $carte->image_url,
                'quantite'  => $quantite,
            ] : null,
            'badges_debloques' => $badges,
        ]);
    }

}
