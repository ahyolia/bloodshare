<?php

namespace App\Filament\Resources\QuizResource\Pages;

use App\Filament\Resources\QuizResource;
use Filament\Actions;
use Filament\Resources\Pages\CreateRecord;

use App\Filament\Concerns\RedirectsToIndex;

class CreateQuiz extends CreateRecord
{
    use RedirectsToIndex;

    protected static string $resource = QuizResource::class;
}
