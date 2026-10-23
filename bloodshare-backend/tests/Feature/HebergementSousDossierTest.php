<?php

namespace Tests\Feature;

use App\Models\Badge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Facade;
use Tests\TestCase;

// 📖 Sur le serveur de démo (sae203), Apache sert le backend depuis un dossier
//    utilisateur : https://sae203.hopto.org/~cameliaa/. Toutes les URLs générées
//    doivent garder ce préfixe, et l'API doit accepter les appels du front Netlify.
class HebergementSousDossierTest extends TestCase
{
    private function simulerRequeteSousDossier(): void
    {
        // Ce qu'Apache transmet à PHP pour https://sae203.hopto.org/~cameliaa/api/badges
        // une fois le .htaccess de Laravel appliqué.
        $request = Request::create('https://sae203.hopto.org/~cameliaa/api/badges', 'GET', [], [], [], [
            'SCRIPT_NAME' => '/~cameliaa/index.php',
            'SCRIPT_FILENAME' => '/home/cameliaa/public_html/index.php',
            'PHP_SELF' => '/~cameliaa/index.php',
        ]);

        $this->app->instance('request', $request);
        Facade::clearResolvedInstance('request');
    }

    public function test_l_url_d_image_garde_le_sous_dossier(): void
    {
        $this->simulerRequeteSousDossier();

        $badge = new Badge;
        $badge->setRawAttributes(['image_url' => 'badges/premier-don.png']);

        $this->assertSame(
            'https://sae203.hopto.org/~cameliaa/storage/badges/premier-don.png',
            $badge->image_url
        );
    }

    public function test_l_url_d_image_sans_sous_dossier_ne_change_pas(): void
    {
        // Backend servi à la racine (Docker local, tunnel ngrok) : rien ne change.
        $this->app->instance('request', Request::create('http://192.168.1.10:8000/api/badges'));
        Facade::clearResolvedInstance('request');

        $badge = new Badge;
        $badge->setRawAttributes(['image_url' => 'badges/premier-don.png']);

        $this->assertSame('http://192.168.1.10:8000/storage/badges/premier-don.png', $badge->image_url);
    }

    public function test_le_chemin_relatif_est_retrouve_depuis_une_url_avec_sous_dossier(): void
    {
        // Sans ça, enregistrer un formulaire Filament réécrirait l'URL absolue en base
        // et l'image deviendrait introuvable.
        $this->assertSame(
            'badges/premier-don.png',
            Badge::cheminRelatifImage('https://sae203.hopto.org/~cameliaa/storage/badges/premier-don.png')
        );
        $this->assertSame(
            'badges/premier-don.png',
            Badge::cheminRelatifImage('http://localhost:8000/storage/badges/premier-don.png')
        );
    }

    public function test_le_backoffice_envoie_les_actions_livewire_dans_le_sous_dossier(): void
    {
        // 📖 Sans le sous-dossier, le navigateur poste sur https://sae203.hopto.org/livewire/update
        //    (hors du dossier utilisateur) : la connexion au backoffice est impossible.
        $this->call('GET', 'https://sae203.hopto.org/~cameliaa/admin/login', [], [], [], [
            'SCRIPT_NAME' => '/~cameliaa/index.php',
            'SCRIPT_FILENAME' => '/home/cameliaa/public_html/index.php',
            'PHP_SELF' => '/~cameliaa/index.php',
        ])
            ->assertOk()
            ->assertSee('data-update-uri="/~cameliaa/livewire/update"', false);
    }

    public function test_les_actions_livewire_restent_a_la_racine_sans_sous_dossier(): void
    {
        $this->get('/admin/login')
            ->assertOk()
            ->assertSee('data-update-uri="/livewire/update"', false);
    }

    public function test_l_api_accepte_le_preflight_cors_du_front_autorise(): void
    {
        config(['cors.allowed_origins' => ['https://aima-nc.netlify.app']]);

        $this->call('OPTIONS', '/api/me', [], [], [], [
            'HTTP_ORIGIN' => 'https://aima-nc.netlify.app',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'GET',
            'HTTP_ACCESS_CONTROL_REQUEST_HEADERS' => 'authorization',
        ])
            ->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'https://aima-nc.netlify.app');
    }

    public function test_l_api_refuse_une_origine_non_autorisee(): void
    {
        config(['cors.allowed_origins' => ['https://aima-nc.netlify.app']]);

        $reponse = $this->call('OPTIONS', '/api/me', [], [], [], [
            'HTTP_ORIGIN' => 'https://site-inconnu.example',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'GET',
        ]);

        // 📖 Avec une seule origine autorisée, Laravel renvoie toujours celle-ci : c'est
        //    le navigateur qui bloque, car elle ne correspond pas à l'origine appelante.
        $this->assertNotSame('https://site-inconnu.example', $reponse->headers->get('Access-Control-Allow-Origin'));
    }

    public function test_les_origines_cors_se_reglent_par_variable_d_environnement(): void
    {
        $config = fn () => require config_path('cors.php');

        // 📖 env() lit $_SERVER et $_ENV avant getenv() : en CI, le .env copié depuis
        //    .env.example y met déjà CORS_ALLOWED_ORIGINS=*, qu'un putenv() seul ne
        //    remplace pas. On fixe donc la variable aux trois endroits, puis on remet tout.
        $avant = [$_SERVER['CORS_ALLOWED_ORIGINS'] ?? null, $_ENV['CORS_ALLOWED_ORIGINS'] ?? null, getenv('CORS_ALLOWED_ORIGINS')];
        $definir = function (?string $valeur): void {
            foreach (['_SERVER', '_ENV'] as $source) {
                if ($valeur === null) {
                    unset($GLOBALS[$source]['CORS_ALLOWED_ORIGINS']);
                } else {
                    $GLOBALS[$source]['CORS_ALLOWED_ORIGINS'] = $valeur;
                }
            }
            putenv($valeur === null ? 'CORS_ALLOWED_ORIGINS' : "CORS_ALLOWED_ORIGINS={$valeur}");
        };

        try {
            $definir(null);
            $this->assertSame(['*'], $config()['allowed_origins']);

            $definir('https://aima-nc.netlify.app, http://localhost:8081');
            $this->assertSame(['https://aima-nc.netlify.app', 'http://localhost:8081'], $config()['allowed_origins']);
        } finally {
            [$server, $env, $getenv] = $avant;
            $definir(null);
            if ($server !== null) {
                $_SERVER['CORS_ALLOWED_ORIGINS'] = $server;
            }
            if ($env !== null) {
                $_ENV['CORS_ALLOWED_ORIGINS'] = $env;
            }
            if ($getenv !== false) {
                putenv("CORS_ALLOWED_ORIGINS={$getenv}");
            }
        }
    }
}
