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
     */
    public function aFeter(Request $request)
    {
        $notifications = $request->user()
            ->unreadNotifications()
            ->where('type', BadgeDebloqueNotification::class)
            ->oldest()
            ->limit(5)
            ->get();

        $badges = Badge::whereIn('id', $notifications->pluck('data.badge_id')->filter())
            ->get()
            ->keyBy('id');

        $data = $notifications
            ->map(function ($notification) use ($badges) {
                // 📖 Notifications d'avant l'ajout de `badge_id` : on retrouve le badge
                //    par son nom, écrit entre guillemets « » dans le corps du message.
                $badge = $badges->get($notification->data['badge_id'] ?? null)
                    ?? (preg_match('/«\s*(.+?)\s*»/u', $notification->data['body'] ?? '', $m)
                        ? Badge::where('nom', $m[1])->first()
                        : null);

                return $badge ? [
                    'notification_id' => $notification->id,
                    'id' => $badge->id,
                    'nom' => $badge->nom,
                    'image_url' => $badge->image_url,                ] : null;
            })
            ->filter()
            ->values();

        return response()->json($data);
    }
}
