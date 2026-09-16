<?php

namespace App\Filament\Resources\AdminResource\Pages;

use App\Filament\Resources\AdminResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

use App\Filament\Concerns\RedirectsToIndex;

class EditAdmin extends EditRecord
{
    use RedirectsToIndex;

    protected static string $resource = AdminResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
