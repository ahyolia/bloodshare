<?php

namespace App\Filament\Resources\ParrainageResource\Pages;

use App\Filament\Resources\ParrainageResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListParrainages extends ListRecords
{
    protected static string $resource = ParrainageResource::class;

    protected function getHeaderActions(): array
    {
        return [
            //
        ];
    }
}
