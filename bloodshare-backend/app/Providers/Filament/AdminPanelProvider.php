<?php

namespace App\Providers\Filament;

use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use App\Models\User;
use Filament\Widgets;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->path('admin')
            ->login()
            // 📖 Identité Aïma : nom dans l'onglet et la barre latérale, logo (variante
            //    claire pour le thème sombre) et favicon. Les fichiers de public/images/branding
            //    sont provisoires : le logo officiel les remplacera sous le même nom.
            ->brandName('Aïma')
            ->brandLogo(asset('images/branding/logo-aima.svg'))
            ->darkModeBrandLogo(asset('images/branding/logo-aima-sombre.svg'))
            ->brandLogoHeight('2.25rem')
            // PNG et non SVG : Safari n'affiche pas les favicons SVG.
            ->favicon(asset('images/branding/favicon-aima.png'))
            // 📖 Corail = couleur de marque de l'app (bloodshare-mobile/constants/palette.ts).
            //    Seule la couleur « primary » change : les couleurs de statut (success,
            //    warning, danger) des badges restent celles de Filament.
            ->colors([
                'primary' => Color::hex('#F07A5E'),
            ])
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\\Filament\\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\\Filament\\Pages')
            ->pages([
                Pages\Dashboard::class,
            ])
            ->discoverWidgets(in: app_path('Filament/Widgets'), for: 'App\\Filament\\Widgets')
            ->widgets([
                Widgets\AccountWidget::class,
                Widgets\FilamentInfoWidget::class,
                \App\Filament\Widgets\StatsOverview::class,
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                \Filament\Http\Middleware\Authenticate::class,
            ]);
    }
}
