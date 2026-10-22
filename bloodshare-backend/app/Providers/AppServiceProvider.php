<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Notifications\Events\NotificationSending;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
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

        $this->configurerLimitesDeRequetes();
    }

    /**
     * 📖 L'IP seule ne suffit pas : trustProxies('*') (bootstrap/app.php) fait confiance à
     *    X-Forwarded-For, qu'un client joignant le backend en direct peut changer à chaque
     *    requête. Prouvé en local : 8 tentatives de connexion avec 8 IP inventées, aucune
     *    bloquée (audit cybersécurité). D'où des limites par compte visé ou par utilisateur
     *    connecté, que l'en-tête ne peut pas contourner.
     */
    private function configurerLimitesDeRequetes(): void
    {
        // Connexion : 6/min par compte visé (force brute sur un mot de passe), 30/min par IP.
        RateLimiter::for('connexion', fn (Request $request) => [
            Limit::perMinute(6)->by('email:' . mb_strtolower(trim((string) $request->input('email')))),
            Limit::perMinute(30)->by('ip:' . $request->ip()),
        ]);

        // Toute l'API : par utilisateur connecté, par IP sinon (contenus publics).
        // 📖 user('sanctum') : ce limiteur passe avant auth:sanctum, user() serait encore vide.
        RateLimiter::for('api', fn (Request $request) => ($user = $request->user('sanctum'))
            ? Limit::perMinute(120)->by('user:' . $user->id)
            : Limit::perMinute(300)->by('ip:' . $request->ip()));
    }
}
