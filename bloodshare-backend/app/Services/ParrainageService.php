<?php

namespace App\Services;

use App\Models\Carte;
use App\Models\Parrainage;
use App\Models\PointsHistorique;
use App\Models\User;
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

        // 📖 Délégué à BadgeService, qui recalcule l'éligibilité du parrain à partir de
        //    son état réel (ici : au moins un parrainage validé) plutôt que de ne vérifier
        //    que ce seul événement — voir BadgeService::synchroniser pour le pourquoi.
        $nouveauxBadges = app(BadgeService::class)->synchroniser($parrain);
        $badgeDebloque = collect($nouveauxBadges)->firstWhere('nom', 'Ambassadeur');

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

        // 📖 La carte Parrain / Filleul n'est donnée qu'une seule fois : à partir du 2e
        //    filleul, un parrain ne gagne que des points (ni carte en plus, ni quantité
        //    qui grimpe). Le badge Ambassadeur suit la même règle (cf. attribuerBadgeAmbassadeur).
        $dejaObtenue = UserCarte::where('user_id', $user->id)
            ->where('carte_id', $carte->id)
            ->exists();

        if ($dejaObtenue) {
            return;
        }

        UserCarte::create([
            'user_id'    => $user->id,
            'carte_id'   => $carte->id,
            'quantite'   => 1,
            'obtenue_at' => now(),
        ]);
    }

}
