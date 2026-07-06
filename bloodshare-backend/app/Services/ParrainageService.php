<?php

namespace App\Services;

use App\Models\Badge;
use App\Models\Carte;
use App\Models\Parrainage;
use App\Models\PointsHistorique;
use App\Models\User;
use App\Models\UserBadge;
use App\Models\UserCarte;

class ParrainageService
{
    public function validerSiFilleul(User $user): ?array
    {
        $parrainage = Parrainage::where('filleul_id', $user->id)
            ->where('statut', 'en_attente')
            ->first();

        if (! $parrainage) {
            return null;
        }

        $parrainage->update([
            'statut'    => 'valide',
            'valide_at' => now(),
        ]);

        $parrain = $parrainage->parrain;

        PointsHistorique::create([
            'user_id'   => $parrain->id,
            'points'    => 75,
            'source'    => 'parrainage',
            'source_id' => $parrainage->id,
        ]);
        $parrain->increment('points_cumules', 75);

        PointsHistorique::create([
            'user_id'   => $user->id,
            'points'    => 50,
            'source'    => 'parrainage',
            'source_id' => $parrainage->id,
        ]);
        $user->increment('points_cumules', 50);

        $this->attribuerCarte($parrain, 'parrain');
        $this->attribuerCarte($user, 'filleul');

        $badgeDebloque = $this->attribuerBadgeAmbassadeur($parrain);

        return [
            'parrainage_id'    => $parrainage->id,
            'parrain_id'       => $parrain->id,
            'filleul_id'       => $user->id,
            'badge_debloque'   => $badgeDebloque,
        ];
    }

    private function attribuerCarte(User $user, string $categorie): void
    {
        $carte = Carte::where('categorie', $categorie)
            ->where('statut', 'active')
            ->first();

        if (! $carte) {
            return;
        }

        $userCarte = UserCarte::where('user_id', $user->id)
            ->where('carte_id', $carte->id)
            ->first();

        if ($userCarte) {
            $userCarte->increment('quantite');
        } else {
            UserCarte::create([
                'user_id'    => $user->id,
                'carte_id'   => $carte->id,
                'quantite'   => 1,
                'obtenue_at' => now(),
            ]);
        }
    }

    private function attribuerBadgeAmbassadeur(User $parrain): ?array
    {
        $badge = Badge::where('statut', 'actif')
            ->where('condition_type', 'action_specifique')
            ->where('action_specifique', 'premier_parrainage')
            ->first();

        if (! $badge) {
            return null;
        }

        $dejaObtenu = UserBadge::where('user_id', $parrain->id)
            ->where('badge_id', $badge->id)
            ->exists();

        if ($dejaObtenu) {
            return null;
        }

        UserBadge::create([
            'user_id'   => $parrain->id,
            'badge_id'  => $badge->id,
            'obtenu_at' => now(),
        ]);

        return [
            'id'        => $badge->id,
            'nom'       => $badge->nom,
            'image_url' => $badge->image_url,
        ];
    }
}
