<?php

namespace App\Providers;

use App\Models\User;
use App\Support\Livewire\HandleRequestsSousDossier;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Notifications\Events\NotificationSending;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Livewire\Mechanisms\HandleRequests\HandleRequests;
use NotificationChannels\WebPush\Events\NotificationFailed;

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

        // 📖 Abonnement push signé avec une autre clé VAPID que celle du serveur (clés
        //    régénérées, app compilée avec une ancienne clé) : le service push répond 403 à
        //    chaque envoi, pour toujours. Le paquet ne supprime que les abonnements expirés
        //    (404/410) ; on retire aussi ceux-là, l'app en recrée un avec la bonne clé.
        //    Avertissement à chaque suppression : une série d'un coup signale une clé changée.
        Event::listen(NotificationFailed::class, function (NotificationFailed $event) {
            if ($event->report->getResponse()?->getStatusCode() === 403) {
                Log::warning('Abonnement push refusé (403, clé VAPID différente) : supprimé', [
                    'abonnement_id' => $event->subscription->id,
                    'user_id' => $event->subscription->subscribable_id,
                ]);
                $event->subscription->delete();
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
