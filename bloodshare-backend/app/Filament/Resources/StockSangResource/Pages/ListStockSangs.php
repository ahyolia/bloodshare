<?php

namespace App\Filament\Resources\StockSangResource\Pages;

use App\Filament\Resources\StockSangResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListStockSangs extends ListRecords
{
    protected static string $resource = StockSangResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
