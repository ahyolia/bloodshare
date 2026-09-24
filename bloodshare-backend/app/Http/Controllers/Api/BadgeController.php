<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Models\UserBadge;
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
}
