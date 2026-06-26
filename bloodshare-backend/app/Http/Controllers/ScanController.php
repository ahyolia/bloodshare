<?php

namespace App\Http\Controllers;

use App\Models\Badge;
use App\Models\Carte;
use App\Models\Don;
use App\Models\QrCode;
use App\Models\QrCodeScan;
use App\Models\UserBadge;
use App\Models\UserCarte;
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
                UserCarte::create([
                    'user_id'    => $user->id,
                    'carte_id'   => $carte->id,
                    'quantite'   => 1,
                    'obtenue_at' => now(),
                ]);
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

        $badges = $this->attribuerBadgesDon($user);

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
                UserCarte::create([
                    'user_id'    => $user->id,
                    'carte_id'   => $carte->id,
                    'quantite'   => 1,
                    'obtenue_at' => now(),
                ]);
            }
        }

        $evenement = $qrCode->evenement;

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
            'badges_debloques' => [],
        ]);
    }

    private function attribuerBadgesDon($user): array
    {
        $nbDons = Don::where('user_id', $user->id)
            ->where('statut', 'valide')
            ->count();

        $dejObtenuIds = UserBadge::where('user_id', $user->id)
            ->pluck('badge_id');

        $badgesEligibles = Badge::where('statut', 'actif')
            ->where('condition_type', 'nb_dons')
            ->whereNotIn('id', $dejObtenuIds)
            ->where('condition_valeur', '<=', $nbDons)
            ->get();

        $nouveauxBadges = [];
        foreach ($badgesEligibles as $badge) {
            UserBadge::create([
                'user_id'    => $user->id,
                'badge_id'   => $badge->id,
                'obtenu_at'  => now(),
            ]);
            $nouveauxBadges[] = [
                'id'        => $badge->id,
                'nom'       => $badge->nom,
                'image_url' => $badge->image_url,
            ];
        }

        return $nouveauxBadges;
    }
}
