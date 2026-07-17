<?php

namespace App\Filament\Resources\QuestionEligibiliteResource\Pages;

use App\Filament\Resources\QuestionEligibiliteResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditQuestionEligibilite extends EditRecord
{
    protected static string $resource = QuestionEligibiliteResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
