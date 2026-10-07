<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private NotificationService $notifications)
    {
    }

    public function storeSubscription(Request $request)
    {
        $validated = $request->validate([
            'endpoint' => 'required|string',
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
            ->through(fn ($notification) => [
                'id' => $notification->id,
                'titre' => $notification->data['title'] ?? null,
                'corps' => $notification->data['body'] ?? null,
                'lue' => $notification->read_at !== null,
                'created_at' => $notification->created_at,
            ]);

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
