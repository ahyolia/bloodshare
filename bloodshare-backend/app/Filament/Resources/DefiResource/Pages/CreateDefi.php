<?php

namespace App\Filament\Resources\DefiResource\Pages;

use App\Filament\Resources\DefiResource;
use Filament\Actions;
use Filament\Resources\Pages\CreateRecord;

class CreateDefi extends CreateRecord
{
    protected static string $resource = DefiResource::class;

    protected function afterCreate(): void
    {
        if ($this->record->statut === 'actif') {
            \App\Models\Defi::where('id', '!=', $this->record->id)
                ->where('statut', 'actif')
                ->update(['statut' => 'termine']);
        }
    }
}
