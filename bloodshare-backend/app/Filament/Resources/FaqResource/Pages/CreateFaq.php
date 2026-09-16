<?php

namespace App\Filament\Resources\FaqResource\Pages;

use App\Filament\Resources\FaqResource;
use Filament\Actions;
use Filament\Resources\Pages\CreateRecord;

use App\Filament\Concerns\RedirectsToIndex;

class CreateFaq extends CreateRecord
{
    use RedirectsToIndex;

    protected static string $resource = FaqResource::class;
}
