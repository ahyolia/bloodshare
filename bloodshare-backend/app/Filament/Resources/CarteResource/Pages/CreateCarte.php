<?php

namespace App\Filament\Resources\CarteResource\Pages;

use App\Filament\Resources\CarteResource;
use Filament\Actions;
use Filament\Resources\Pages\CreateRecord;

use App\Filament\Concerns\RedirectsToIndex;

class CreateCarte extends CreateRecord
{
    use RedirectsToIndex;

    protected static string $resource = CarteResource::class;
}
