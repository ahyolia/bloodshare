<?php

namespace App\Filament\Pages;

use Filament\Pages\Page;

class ConfigurationGlobale extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-cog-6-tooth';
    protected static ?string $navigationGroup = 'Administration';
    protected static ?string $navigationLabel = 'Configuration';

    protected static string $view = 'filament.pages.configuration-globale';

    public static function canAccess(): bool
    {
        return auth()->user()->hasRole('super_admin');
    }

    public function getPointsParAction(): array
    {
        return [
            ['action' => 'Quiz complété (1ère fois)', 'points' => '30'],
            ['action' => 'Défi du mois complété', 'points' => 'Variable'],
            ['action' => 'Parrainage validé (parrain)', 'points' => '75'],
            ['action' => 'Parrainage validé (filleul)', 'points' => '50'],
            ['action' => 'Doublon carte commune', 'points' => '— (retiré)'],
            ['action' => 'Doublon carte rare', 'points' => '— (retiré)'],
        ];
    }
}
