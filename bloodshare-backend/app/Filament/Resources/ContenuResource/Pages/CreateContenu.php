<?php

namespace App\Filament\Resources\ContenuResource\Pages;

use App\Filament\Resources\ContenuResource;
use Filament\Actions;
use Filament\Resources\Pages\CreateRecord;

use App\Filament\Concerns\RedirectsToIndex;

class CreateContenu extends CreateRecord
{
    use RedirectsToIndex;

    protected static string $resource = ContenuResource::class;
}
