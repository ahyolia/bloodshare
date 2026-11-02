<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MetAJourDerniereActivite
{
    /**
     * 📖 derniere_connexion n'était mise à jour qu'au login (AuthController::login) :
     *    un utilisateur resté connecté et actif tous les jours recevait quand même
     *    "On ne vous a pas vu récemment" au bout de 30 jours (revue @nevizsh). Ce
     *    middleware la rafraîchit sur chaque requête authentifiée — mais seulement si
     *    le jour a changé, pour ne pas écrire en base à chaque appel API.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && (! $user->derniere_connexion || ! $user->derniere_connexion->isToday())) {
            $user->update(['derniere_connexion' => now()]);
        }

        return $next($request);
    }
}
