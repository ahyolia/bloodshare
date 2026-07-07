<?php

namespace App\Filament\Resources\DefiResource\Pages;

use App\Filament\Resources\DefiResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditDefi extends EditRecord
{
    protected static string $resource = DefiResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }

    protected function afterSave(): void
    {
        if ($this->record->statut === 'actif') {
            \App\Models\Defi::where('id', '!=', $this->record->id)
                ->where('statut', 'actif')
                ->update(['statut' => 'termine']);
        }
    }
}
