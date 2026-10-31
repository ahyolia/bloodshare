<?php

namespace App\Filament\Resources\ContenuResource\Pages;

use App\Filament\Resources\ContenuResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

use App\Filament\Concerns\RedirectsToIndex;

class EditContenu extends EditRecord
{
    use RedirectsToIndex;

    protected static string $resource = ContenuResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
