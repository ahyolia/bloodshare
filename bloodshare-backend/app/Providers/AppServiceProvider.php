<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Notifications\Events\NotificationSending;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // 📖 RGPD : un compte supprimé ne doit plus rien recevoir ni accumuler en base. Plusieurs
        //    commandes planifiées partent des dons ou des quiz pour trouver qui notifier, et
        //    retrouveraient donc aussi les comptes anonymisés : on bloque l'envoi ici, une seule
        //    fois pour tous les canaux, plutôt que de répéter le filtre dans chaque commande.
        //    Renvoyer `false` depuis un écouteur de NotificationSending annule l'envoi.
        Event::listen(NotificationSending::class, function (NotificationSending $event) {
            if ($event->notifiable instanceof User && $event->notifiable->statut === 'supprime') {
                return false;
            }
        });
    }
}
