<?php

namespace App\Filament\Resources\QuestionEligibiliteResource\Pages;

use App\Filament\Concerns\RedirectsToIndex;
use App\Filament\Resources\QuestionEligibiliteResource;
use Filament\Resources\Pages\EditRecord;

class EditQuestionEligibilite extends EditRecord
{
    use RedirectsToIndex;

    protected static string $resource = QuestionEligibiliteResource::class;
}
