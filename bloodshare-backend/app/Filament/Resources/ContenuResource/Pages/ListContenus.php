<?php

namespace App\Filament\Resources\ContenuResource\Pages;

use App\Filament\Resources\ContenuResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListContenus extends ListRecords
{
    protected static string $resource = ContenuResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
