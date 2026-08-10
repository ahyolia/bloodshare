<?php

namespace App\Filament\Resources\EvenementResource\Pages;

use App\Filament\Resources\EvenementResource;
use App\Models\QrCode;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Str;

class CreateEvenement extends CreateRecord
{
    protected static string $resource = EvenementResource::class;

    protected function afterCreate(): void
    {
        $qrCode = QrCode::create([
            'type' => 'evenement',
            'token' => Str::random(40),
            'evenement_id' => $this->record->id,
            'actif' => true,
        ]);

        $this->record->update(['qr_code_id' => $qrCode->id]);
    }
}
