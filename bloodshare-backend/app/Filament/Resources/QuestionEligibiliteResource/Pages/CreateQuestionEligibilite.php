<?php

namespace App\Filament\Resources\QuestionEligibiliteResource\Pages;

use App\Filament\Concerns\RedirectsToIndex;
use App\Filament\Resources\QuestionEligibiliteResource;
use Filament\Resources\Pages\CreateRecord;

class CreateQuestionEligibilite extends CreateRecord
{
    use RedirectsToIndex;

    protected static string $resource = QuestionEligibiliteResource::class;
}
