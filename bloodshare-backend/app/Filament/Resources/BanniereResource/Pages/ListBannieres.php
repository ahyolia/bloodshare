<?php

namespace App\Filament\Resources\BanniereResource\Pages;

use App\Filament\Resources\BanniereResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListBannieres extends ListRecords
{
    protected static string $resource = BanniereResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
