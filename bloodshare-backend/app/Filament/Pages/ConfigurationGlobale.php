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
        // 📖 Seules sources de points réelles (voir docs/doc_gamification.md § 1). Le filleul
        //    et le défi du mois n'en rapportent plus : leurs bénéficiaires sont des donneurs,
        //    et un don ne rapporte jamais de points (règle éthique ADSB-NC).
        return [
            ['action' => 'Quiz complété (1ère fois)', 'points' => 'Défini sur chaque quiz, proportionnel au score'],
            ['action' => 'Parrainage validé (parrain)', 'points' => '75'],
        ];
    }
}
