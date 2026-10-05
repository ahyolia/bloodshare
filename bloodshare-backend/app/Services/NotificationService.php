<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Notifications\Notification;

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

    // 📖 Diffusion synchrone (pas de queue : aucun worker n'est garanti tourner
    //    tant que l'hébergement n'est pas en place). Acceptable à l'échelle
    //    d'un projet étudiant ; à revoir si le nombre d'utilisateurs grossit.
    public function notifierTousLesUsers(Notification $notification): void
    {
        User::where('statut', '!=', 'supprime')
            ->get()
            ->each(fn (User $user) => $user->notify($notification));
    }

    public function verifierNouveauNiveau(User $user): void
    {
        if (! $user->wasChanged('points_cumules')) {
            return;
        }

        $niveauAvant = NiveauService::calculerNiveau((int) ($user->getOriginal('points_cumules') ?? 0))['niveau'];
        $niveauApres = NiveauService::calculerNiveau((int) $user->points_cumules)['niveau'];

        if ($niveauApres > $niveauAvant) {
            $label = NiveauService::calculerNiveau((int) $user->points_cumules)['label'];
            $user->notify(new \App\Notifications\NiveauAtteintNotification($label));
        }
    }
}
