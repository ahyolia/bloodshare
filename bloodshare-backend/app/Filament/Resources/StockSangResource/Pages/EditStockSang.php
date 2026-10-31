<?php

namespace App\Filament\Resources\StockSangResource\Pages;

use App\Filament\Resources\StockSangResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

use App\Filament\Concerns\RedirectsToIndex;

class EditStockSang extends EditRecord
{
    use RedirectsToIndex;

    protected static string $resource = StockSangResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
