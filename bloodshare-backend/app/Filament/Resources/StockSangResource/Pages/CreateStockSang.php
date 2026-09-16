<?php

namespace App\Filament\Resources\StockSangResource\Pages;

use App\Filament\Resources\StockSangResource;
use Filament\Actions;
use Filament\Resources\Pages\CreateRecord;

use App\Filament\Concerns\RedirectsToIndex;

class CreateStockSang extends CreateRecord
{
    use RedirectsToIndex;

    protected static string $resource = StockSangResource::class;
}
