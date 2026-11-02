<?php

namespace App\Filament\Resources\BanniereResource\Pages;

use App\Filament\Resources\BanniereResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

use App\Filament\Concerns\RedirectsToIndex;

class EditBanniere extends EditRecord
{
    use RedirectsToIndex;

    protected static string $resource = BanniereResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
