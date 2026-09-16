<?php

namespace App\Filament\Resources\BadgeResource\Pages;

use App\Filament\Resources\BadgeResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

use App\Filament\Concerns\RedirectsToIndex;

class EditBadge extends EditRecord
{
    use RedirectsToIndex;

    protected static string $resource = BadgeResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
