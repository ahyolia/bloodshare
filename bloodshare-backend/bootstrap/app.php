<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withSchedule(function (Schedule $schedule) {
        // 📖 Aucun scheduler n'était encore activé sur dev (bootstrap/app.php n'avait pas
        //    de ->withSchedule) : nécessaire pour que les commandes ci-dessous tournent
        //    réellement en continu, pas seulement quand on les lance à la main.
        $schedule->command('notifications:quiz-du-jour')->dailyAt('08:00');
        $schedule->command('notifications:veille-evenement')->dailyAt('08:10');
        $schedule->command('notifications:fin-ineligibilite')->dailyAt('09:00');
        $schedule->command('notifications:retour-inactivite')->dailyAt('09:10');
        $schedule->command('notifications:quiz-non-termine')->dailyAt('09:20');
        $schedule->command('notifications:anniversaire-don')->dailyAt('09:30');
        $schedule->command('notifications:journee-mondiale')->dailyAt('09:40');
        $schedule->command('notifications:carte-du-mois')->dailyAt('09:50');
        $schedule->command('notifications:progression-defi')->weeklyOn(1, '10:00');
    })
    ->withMiddleware(function (Middleware $middleware) {
        // Derrière ngrok/Dokploy (Traefik), la requête arrive en HTTP en interne :
        // sans ça, Laravel ignore X-Forwarded-Proto et génère des URLs d'assets
        // en http:// sur une page servie en https:// (mixed content bloqué).
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
