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
            // 📖 Même règles que la fiche Admin (ViewAdmin) : anonymisation plutôt qu'effacement
            //    de la ligne, et jamais sur son propre compte.
            Actions\DeleteAction::make()
                ->hidden(fn (): bool => $this->record->is(auth()->user()))
                ->using(fn ($record) => $record->anonymiser()),
        ];
    }
}
