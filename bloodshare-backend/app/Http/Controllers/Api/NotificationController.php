<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Rules\EndpointPushAutorise;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Catégorie d'affichage par classe de notification : l'app en tire l'icône et
     * la couleur de la pastille. Une classe absente de la table tombe sur « autre ».
     */
    private const CATEGORIES = [
        'BadgeDebloqueNotification' => 'badge',
        'NiveauAtteintNotification' => 'niveau',
        'NouveauQuizNotification' => 'quiz',
        'QuizDuJourNotification' => 'quiz',
        'QuizNonTermineNotification' => 'quiz',
        'DefiReussiNotification' => 'defi',
        'NouveauDefiNotification' => 'defi',
        'ProgressionDefiNotification' => 'defi',
        'NouvelEvenementNotification' => 'evenement',
        'VeilleEvenementNotification' => 'evenement',
        'JourneeMondialeNotification' => 'evenement',
        'AnniversaireDonNotification' => 'don',
        'FinIneligibiliteNotification' => 'don',
        'RetourInactiviteNotification' => 'don',
        'RemerciementPenurieNotification' => 'don',
        'AlertePenurieNotification' => 'alerte',
        'BanniereUrgenteNotification' => 'alerte',
        'FilleulInscritNotification' => 'parrainage',
        'PremierDonFilleulNotification' => 'parrainage',
        'CarteDuMoisNotification' => 'carte',
    ];

    /**
     * Page de repli par catégorie, pour les notifications enregistrées avant que chacune
     * porte son lien (`data.url`, posé dans toWebPush) : sans l'événement ou le quiz
     * précis, on ouvre la rubrique. « autre » : aucun lien, la ligne n'ouvre rien.
     */
    private const LIENS_PAR_CATEGORIE = [
        'badge' => '/tabs/profil/badges',
        'niveau' => '/tabs/profil/points',
        'quiz' => '/tabs/quiz',
        'defi' => '/tabs',
        'evenement' => '/tabs',
        'don' => '/tabs/don',
        'alerte' => '/tabs',
        'parrainage' => '/tabs/profil/parrainage',
        'carte' => '/tabs/cartes',
    ];

    public function __construct(private NotificationService $notifications)
    {
    }

    public function storeSubscription(Request $request)
    {
        $validated = $request->validate([
            'endpoint' => ['required', 'string', 'max:500', new EndpointPushAutorise()],
            'keys' => 'required|array',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
            'contentEncoding' => 'nullable|string',
        ]);

        $this->notifications->enregistrerAbonnement($request->user(), $validated);

        return response()->json([
            'message' => 'Abonnement aux notifications enregistré.',
        ], 201);
    }

    public function destroySubscription(Request $request)
    {
        $validated = $request->validate([
            'endpoint' => 'required|string',
        ]);

        $this->notifications->retirerAbonnement($request->user(), $validated['endpoint']);

        return response()->json([
            'message' => 'Abonnement aux notifications retiré.',
        ]);
    }

    public function index(Request $request)
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->paginate(20)
            ->through(function ($notification) {
                $categorie = self::CATEGORIES[class_basename($notification->type)] ?? 'autre';

                return [
                    'id' => $notification->id,
                    'titre' => $notification->data['title'] ?? null,
                    'corps' => $notification->data['body'] ?? null,
                    'lue' => $notification->read_at !== null,
                    'categorie' => $categorie,
                    'lien' => $notification->data['data']['url'] ?? self::LIENS_PAR_CATEGORIE[$categorie] ?? null,
                    'created_at' => $notification->created_at,
                ];
            });

        return response()->json($notifications);
    }

    public function countUnread(Request $request)
    {
        return response()->json([
            'count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    public function markAsRead(Request $request, string $id)
    {
        $notification = $request->user()->notifications()->where('id', $id)->firstOrFail();
        $notification->markAsRead();

        return response()->json(['message' => 'Notification marquée comme lue.']);
    }

    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'Notifications marquées comme lues.']);
    }
}
