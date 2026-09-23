<?php

namespace App\Services;

use App\Models\Badge;
use App\Models\Don;
use App\Models\Parrainage;
use App\Models\User;
use App\Models\UserBadge;
use App\Models\UserQuiz;

class BadgeService
{
    /**
     * 📖 Avant ce service, chaque badge n'était vérifié qu'au moment précis de
     *    l'action qui le déclenche (un scan, une validation de parrainage, un quiz
     *    soumis). Un utilisateur qui remplissait déjà la condition AVANT que cette
     *    vérification existe, ou dont le don a été enregistré autrement (BO, import),
     *    ne recevait jamais son badge : rien ne revenait vérifier son état après coup.
     *
     *    synchroniser() calcule l'état réel de l'utilisateur (dons validés,
     *    parrainages validés, quiz terminés) et attribue tout badge éligible non
     *    encore obtenu, quelle que soit la raison pour laquelle il ne l'était pas.
     *    Appelé à la fois juste après une action (scan, quiz...) et à chaque
     *    consultation de GET /badges, pour que l'écran se corrige tout seul.
     */
    public function synchroniser(User $user): array
    {
        $dejaObtenuIds = UserBadge::where('user_id', $user->id)->pluck('badge_id');

        $nbDons = Don::where('user_id', $user->id)->where('statut', 'valide')->count();

        $actionsEligibles = collect([
            'premier_don' => $nbDons >= 1,
            'premier_parrainage' => Parrainage::where('parrain_id', $user->id)
                ->where('statut', 'valide')
                ->exists(),
            'cinq_quiz' => UserQuiz::where('user_id', $user->id)
                ->where('complete', true)
                ->count() >= 5,
        ])->filter()->keys();

        $badgesEligibles = Badge::where('statut', 'actif')
            ->whereNotIn('id', $dejaObtenuIds)
            ->where(function ($query) use ($nbDons, $actionsEligibles) {
                $query->where(function ($q) use ($nbDons) {
                    $q->where('condition_type', 'nb_dons')
                        ->where('condition_valeur', '<=', $nbDons);
                });

                if ($actionsEligibles->isNotEmpty()) {
                    $query->orWhere(function ($q) use ($actionsEligibles) {
                        $q->where('condition_type', 'action_specifique')
                            ->whereIn('action_specifique', $actionsEligibles);
                    });
                }
            })
            ->get();

        $nouveauxBadges = [];

        foreach ($badgesEligibles as $badge) {
            UserBadge::create([
                'user_id' => $user->id,
                'badge_id' => $badge->id,
                'obtenu_at' => now(),
            ]);

            $nouveauxBadges[] = [
                'id' => $badge->id,
                'nom' => $badge->nom,
                'image_url' => $badge->image_url,
            ];
        }

        return $nouveauxBadges;
    }
}
