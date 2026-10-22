<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RefuseCompteBloque
{
    /**
     * 📖 User::suspendre() révoque déjà les tokens : ce middleware est une seconde barrière,
     *    pour un token qui aurait échappé à la révocation (statut changé par un autre
     *    chemin, en base ou par un futur code).
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->estBloque()) {
            return response()->json([
                'message' => "Ton compte est suspendu. Contacte l'association pour en savoir plus.",
            ], 403);
        }

        return $next($request);
    }
}
