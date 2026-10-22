<?php

namespace App\Providers;

use App\Models\User;
use App\Support\Livewire\HandleRequestsSousDossier;
use Illuminate\Notifications\Events\NotificationSending;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Livewire\Mechanisms\HandleRequests\HandleRequests;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // 📖 Livewire enregistre ses mécanismes avant les providers de l'app et les
        //    résout toujours via le conteneur : remplacer l'instance ici suffit, avant
        //    que son boot() ne déclare la route livewire/update. Voir HandleRequestsSousDossier.
        $this->app->instance(HandleRequests::class, new HandleRequestsSousDossier);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // 📖 RGPD : un compte supprimé ne doit plus rien recevoir ni accumuler en base. Les
        //    commandes planifiées excluent déjà ces comptes (scope User::nonSupprimes(), pour
        //    que leur compteur « X notifié(s) » reste juste) ; ce blocage est le filet de
        //    sécurité pour tous les canaux et pour toute commande future qui l'oublierait.
        //    Renvoyer `false` depuis un écouteur de NotificationSending annule l'envoi.
        Event::listen(NotificationSending::class, function (NotificationSending $event) {
            if ($event->notifiable instanceof User && $event->notifiable->statut === 'supprime') {
                return false;
            }
        });
    }
}
