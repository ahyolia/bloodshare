<?php

namespace App\Filament\Resources\BanniereResource\Pages;

use App\Filament\Resources\BanniereResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditBanniere extends EditRecord
{
    protected static string $resource = BanniereResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
