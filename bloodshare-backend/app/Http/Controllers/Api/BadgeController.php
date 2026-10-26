<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Models\UserBadge;
use App\Notifications\BadgeDebloqueNotification;
use App\Services\BadgeService;
use Illuminate\Http\Request;

class BadgeController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // 📖 Un badge peut devenir éligible sans qu'aucune action déclenchante n'ait
        //    tourné depuis (don déjà enregistré avant l'ajout de cette vérification,
        //    par exemple) : on rattrape ici, à chaque consultation, avant de répondre.
        app(BadgeService::class)->synchroniser($user);

        $badges = Badge::where('statut', 'actif')->get();

        $userBadges = UserBadge::where('user_id', $user->id)
            ->get()
            ->keyBy('badge_id');

        $data = $badges->map(function ($badge) use ($userBadges) {
            $userBadge = $userBadges->get($badge->id);

            return [
                'id' => $badge->id,
                'nom' => $badge->nom,
                'image_url' => $badge->image_url,
                'obtenu' => $userBadge !== null,
                'obtenu_at' => $userBadge?->obtenu_at,
            ];
        });

        return response()->json($data);
    }

    /**
     * Badges débloqués que l'app n'a pas encore fêtés : ceux dont la notification
     * « badge débloqué » est encore non lue. L'app affiche le popup de félicitations
     * puis marque la notification comme lue (PUT /notifications/{id}/lue), quel que
     * soit l'endroit où le badge a été gagné (scan, quiz, parrainage, défi…).
     *
     * 📖 Seules les notifications qui portent `badge_id` comptent, c'est-à-dire celles
     *    créées depuis la mise en ligne du popup. Les anciennes non lues sont ignorées,
     *    sinon chaque utilisateur verrait défiler tous ses anciens badges, un par écran,
     *    au premier lancement. `data` est une colonne texte : on cherche la clé dans le
     *    JSON avec LIKE, ce qui marche sur PostgreSQL comme sur SQLite.
     */
    public function aFeter(Request $request)
    {
        $notifications = $request->user()
            ->unreadNotifications()
            ->where('type', BadgeDebloqueNotification::class)
            ->where('data', 'like', '%"badge_id":%')
            ->oldest()
            ->limit(5)
            ->get();

        $badges = Badge::whereIn('id', $notifications->pluck('data.badge_id'))
            ->get()
            ->keyBy('id');

        $data = $notifications
            ->map(function ($notification) use ($badges) {
                $badge = $badges->get($notification->data['badge_id']);

                return $badge ? [
                    'notification_id' => $notification->id,
                    'id' => $badge->id,
                    'nom' => $badge->nom,
                    'image_url' => $badge->image_url,
                ] : null;
            })
            ->filter()
            ->values();

        return response()->json($data);
    }
}
