<?php

namespace App\Filament\Resources\CarteResource\Pages;

use App\Filament\Resources\CarteResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListCartes extends ListRecords
{
    protected static string $resource = CarteResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
