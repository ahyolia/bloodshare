<?php

namespace App\Filament\Resources\BadgeResource\Pages;

use App\Filament\Resources\BadgeResource;
use Filament\Actions;
use Filament\Resources\Pages\CreateRecord;

use App\Filament\Concerns\RedirectsToIndex;

class CreateBadge extends CreateRecord
{
    use RedirectsToIndex;

    protected static string $resource = BadgeResource::class;
}
