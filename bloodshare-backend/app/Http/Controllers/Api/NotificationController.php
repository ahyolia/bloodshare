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
}
