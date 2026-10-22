<?php

namespace Tests\Feature;

use App\Http\Middleware\RefuseCompteBloque;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * 📖 Parcours de toutes les routes de l'API (audit cybersécurité) : une route ajoutée sans
 *    auth:sanctum serait ouverte à tous. Chaque route est soit publique (liste ci-dessous,
 *    sans donnée personnelle), soit connectée et refusée aux comptes suspendus.
 */
class RoutesApiTest extends TestCase
{
    private const PUBLIQUES = [
        'GET api/actualites',
        'GET api/fiches-infos',
        'GET api/stock-sang',
        'GET api/evenements',
        'GET api/bannieres',
        'GET api/eligibilite',
        'GET api/documents-juridiques/{type}',
        'POST api/auth/register',
        'POST api/auth/login',
    ];

    // 📖 Connectée mais accessible à un compte suspendu : se déconnecter doit rester possible.
    private const SANS_CONTROLE_DE_SUSPENSION = [
        'POST api/auth/logout',
    ];

    public function test_chaque_route_de_l_api_est_publique_par_choix_ou_exige_d_etre_connecte(): void
    {
        $routes = collect(Route::getRoutes()->getRoutes())
            ->filter(fn ($route) => str_starts_with($route->uri(), 'api/'));

        $this->assertNotEmpty($routes);

        foreach ($routes as $route) {
            $methode = collect($route->methods())->reject(fn ($m) => $m === 'HEAD')->first();
            $cle = "{$methode} {$route->uri()}";
            $middlewares = $route->gatherMiddleware();

            if (in_array($cle, self::PUBLIQUES, true)) {
                $this->assertNotContains('auth:sanctum', $middlewares, "{$cle} est listée publique mais exige une connexion.");

                continue;
            }

            $this->assertContains('auth:sanctum', $middlewares, "{$cle} est ouverte à tous : ajoute auth:sanctum, ou classe-la publique si c'est voulu.");

            if (! in_array($cle, self::SANS_CONTROLE_DE_SUSPENSION, true)) {
                $this->assertContains(RefuseCompteBloque::class, $middlewares, "{$cle} reste accessible à un compte suspendu.");
            }
        }
    }

    public function test_les_routes_publiques_existent_toujours(): void
    {
        // 📖 Une route publique renommée doit être retirée de la liste, pas oubliée.
        $existantes = collect(Route::getRoutes()->getRoutes())
            ->map(fn ($route) => collect($route->methods())->reject(fn ($m) => $m === 'HEAD')->first() . ' ' . $route->uri());

        foreach ([...self::PUBLIQUES, ...self::SANS_CONTROLE_DE_SUSPENSION] as $cle) {
            $this->assertContains($cle, $existantes, "Route listée mais introuvable : {$cle}");
        }
    }
}
