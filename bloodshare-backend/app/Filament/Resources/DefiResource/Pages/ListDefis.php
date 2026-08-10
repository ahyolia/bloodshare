<?php

namespace App\Filament\Resources\DefiResource\Pages;

use App\Filament\Resources\DefiResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListDefis extends ListRecords
{
    protected static string $resource = DefiResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
