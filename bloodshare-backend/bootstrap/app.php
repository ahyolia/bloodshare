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
        //    réellement en continu, pas seulement quand on les lance à la main. L'app
        //    tourne en UTC (APP_TIMEZONE) ; sans ->timezone(), "08:00" serait lu en UTC et
        //    tomberait à 19:00 à Nouméa (UTC+11). Le public visé est en Nouvelle-Calédonie,
        //    pas en métropole : Pacific/Noumea, pas Europe/Paris.
        $schedule->command('notifications:quiz-du-jour')->dailyAt('08:00')->timezone('Pacific/Noumea');
        $schedule->command('notifications:veille-evenement')->dailyAt('08:10')->timezone('Pacific/Noumea');
        $schedule->command('notifications:fin-ineligibilite')->dailyAt('09:00')->timezone('Pacific/Noumea');
        $schedule->command('notifications:retour-inactivite')->dailyAt('09:10')->timezone('Pacific/Noumea');
        $schedule->command('notifications:quiz-non-termine')->dailyAt('09:20')->timezone('Pacific/Noumea');
        $schedule->command('notifications:anniversaire-don')->dailyAt('09:30')->timezone('Pacific/Noumea');
        $schedule->command('notifications:journee-mondiale')->dailyAt('09:40')->timezone('Pacific/Noumea');
        $schedule->command('notifications:carte-du-mois')->dailyAt('09:50')->timezone('Pacific/Noumea');
        $schedule->command('notifications:progression-defi')->weeklyOn(1, '10:00')->timezone('Pacific/Noumea');
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
