<?php

namespace App\Filament\Resources\QuestionEligibiliteResource\Pages;

use App\Filament\Resources\QuestionEligibiliteResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListQuestionsEligibilite extends ListRecords
{
    protected static string $resource = QuestionEligibiliteResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
