<?php

namespace App\Providers\Filament;

use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Actions\EditAction;
use Filament\Tables\Actions\EditAction as TableEditAction;
use Filament\View\PanelsRenderHook;
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
    public function boot(): void
    {
        // 📖 « Modifier » en couleur neutre : en corail (primary par défaut), il se confondait
        //    avec « Supprimer » en rouge, côte à côte sur chaque ligne. Le rouge reste réservé
        //    aux actions destructrices. « gray » = aubergine en mode clair (thème Aïma),
        //    gris clair en mode sombre.
        TableEditAction::configureUsing(fn (TableEditAction $action) => $action->color('gray'));
        EditAction::configureUsing(fn (EditAction $action) => $action->color('gray'));
    }

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
            //    C'est l'accent (liens, cases cochées, focus) ; les boutons pleins et l'élément actif
            //    du menu suivent le design system (aubergine / beige), voir filament/theme-aima.
            //    Nuances fixées à la main pour garder le texte blanc lisible là où Filament met du
            //    corail en fond (WCAG ≥ 4,5:1) : 600 = #A83B24 (6,3:1), 500 = #BF4A30 (5:1),
            //    400 = corail de marque, réservé aux textes et liens en sombre (6,5:1 sur fond noir).
            //    Les couleurs de statut (success, warning, danger) restent celles de Filament.
            ->colors([
                'primary' => [
                    50 => '#FFF4F1',
                    100 => '#FFE8E4',
                    200 => '#FCD0C5',
                    300 => '#F7A893',
                    400 => '#F07A5E',
                    500 => '#BF4A30',
                    600 => '#A83B24',
                    700 => '#8C301D',
                    800 => '#702718',
                    900 => '#5C2114',
                    950 => '#33110A',
                ],
            ])
            // 📖 Mode clair aux couleurs de l'app (beige, aubergine) : voir la vue pour le détail.
            ->renderHook(PanelsRenderHook::STYLES_AFTER, fn (): string => view('filament.theme-aima')->render())
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
