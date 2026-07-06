<?php

namespace App\Filament\Resources\StockSangResource\Pages;

use App\Filament\Resources\StockSangResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditStockSang extends EditRecord
{
    protected static string $resource = StockSangResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
