<?php

namespace App\Filament\Widgets;

use App\Models\Defi;
use App\Models\Don;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverview extends BaseWidget
{
    protected function getStats(): array
    {
        $defi = Defi::where('statut', 'actif')->first();

        return [
            Stat::make('Utilisateurs', User::count())
                ->description('Total des comptes')
                ->icon('heroicon-o-users')
                ->color('info'),

            Stat::make('Dons ce mois', Don::where('statut', 'valide')
                ->whereMonth('date_don', now()->month)
                ->whereYear('date_don', now()->year)
                ->count())
                ->description('Dons validés en ' . now()->translatedFormat('F'))
                ->icon('heroicon-o-heart')
                ->color('danger'),

            Stat::make('Nouveaux (7j)', User::where('created_at', '>=', now()->subDays(7))->count())
                ->description('Inscrits ces 7 derniers jours')
                ->icon('heroicon-o-user-plus')
                ->color('success'),

            Stat::make('Défi du mois', $defi ? $defi->titre : 'Aucun défi actif')
                ->description($defi
                    ? "Objectif : {$defi->objectif_chiffre} dons"
                    : 'Créez un défi depuis la section Gamification')
                ->icon('heroicon-o-trophy')
                ->color($defi ? 'warning' : 'gray'),
        ];
    }
}
