<?php

namespace App\Filament\Resources\DocumentJuridiqueResource\Pages;

use App\Filament\Concerns\RedirectsToIndex;
use App\Filament\Resources\DocumentJuridiqueResource;
use Filament\Resources\Pages\EditRecord;

class EditDocumentJuridique extends EditRecord
{
    use RedirectsToIndex;

    protected static string $resource = DocumentJuridiqueResource::class;
}
