<?php

namespace App\Filament\Resources\CarteResource\Pages;

use App\Filament\Resources\CarteResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditCarte extends EditRecord
{
    protected static string $resource = CarteResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
