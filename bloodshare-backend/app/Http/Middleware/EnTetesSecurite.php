<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnTetesSecurite
{
    /**
     * 📖 En-têtes de sécurité sur toutes les réponses (API, BO, écran du centre) :
     *    - nosniff : le navigateur n'interprète pas un fichier autrement que son type déclaré
     *      (une image uploadée dans le BO ne peut pas être exécutée comme un script) ;
     *    - SAMEORIGIN : le BO ne peut pas être affiché dans une iframe d'un autre site
     *      (clickjacking sur les actions suspendre, supprimer...) ;
     *    - Referrer-Policy : le lien signé de l'écran du centre ne fuit pas vers d'autres sites ;
     *    - HSTS en production, en HTTPS seulement : le navigateur refuse ensuite le HTTP.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        if (app()->isProduction() && $request->secure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000');
        }

        return $response;
    }
}
