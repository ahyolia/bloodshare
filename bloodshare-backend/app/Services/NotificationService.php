<?php

namespace App\Services;

use App\Models\User;

class NotificationService
{
    public function enregistrerAbonnement(User $user, array $abonnement): void
    {
        $user->updatePushSubscription(
            endpoint: $abonnement['endpoint'],
            key: $abonnement['keys']['p256dh'] ?? null,
            token: $abonnement['keys']['auth'] ?? null,
            contentEncoding: $abonnement['contentEncoding'] ?? 'aesgcm',
        );
    }

    public function retirerAbonnement(User $user, string $endpoint): void
    {
        $user->pushSubscriptions()->where('endpoint', $endpoint)->delete();
    }
}
