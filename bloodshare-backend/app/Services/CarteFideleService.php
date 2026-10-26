<?php

namespace App\Services;

use App\Models\Carte;
use App\Models\Don;
use App\Models\User;
use App\Models\UserCarte;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

/**
 * 📖 Carte Fidèle : récompense l'ancienneté, pas le nombre de dons (c'est le rôle du
 *    badge « Fidèle au Don », 5 dons). Elle est donnée au premier don validé au moins
 *    un an après le tout premier don validé du donneur. Une seule fois, sans points
 *    (un don ne rapporte jamais de points). Calculée sur les seules dates de don déjà
 *    enregistrées : aucune donnée personnelle en plus.
 */
class CarteFideleService
{
    public const ANCIENNETE_ANNEES = 1;

    /** La carte si elle vient d'être obtenue, null sinon (déjà possédée, pas encore éligible). */
    public function attribuerSiEligible(User $user): ?Carte
    {
        $carte = Carte::where('categorie', 'fidele')->where('statut', 'active')->first();

        if (! $carte || ! $this->estEligible($user)) {
            return null;
        }

        if (UserCarte::where('user_id', $user->id)->where('carte_id', $carte->id)->exists()) {
            return null;
        }

        // 📖 Même protection que ScanController::handleDon : savepoint + contrainte unique
        //    (user_id, carte_id) contre deux scans simultanés.
        try {
            DB::transaction(fn () => UserCarte::create([
                'user_id'    => $user->id,
                'carte_id'   => $carte->id,
                'quantite'   => 1,
                'obtenue_at' => now(),
            ]));
        } catch (QueryException $e) {
            if (! str_contains($e->getMessage(), 'user_cartes_user_id_carte_id_unique')) {
                throw $e;
            }

            return null;
        }

        return $carte;
    }

    public function estEligible(User $user): bool
    {
        $dons = Don::where('user_id', $user->id)->where('statut', 'valide');

        $premier = (clone $dons)->min('date_don');
        $dernier = (clone $dons)->max('date_don');

        if (! $premier || ! $dernier) {
            return false;
        }

        return Carbon::parse($premier)->addYears(self::ANCIENNETE_ANNEES)->lte(Carbon::parse($dernier));
    }
}
