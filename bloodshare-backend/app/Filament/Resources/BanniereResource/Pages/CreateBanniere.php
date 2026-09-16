<?php

namespace App\Filament\Resources\BanniereResource\Pages;

use App\Filament\Resources\BanniereResource;
use Filament\Resources\Pages\CreateRecord;

use App\Filament\Concerns\RedirectsToIndex;

class CreateBanniere extends CreateRecord
{
    use RedirectsToIndex;

    protected static string $resource = BanniereResource::class;
}
