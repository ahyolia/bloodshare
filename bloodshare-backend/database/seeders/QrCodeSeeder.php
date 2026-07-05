<?php

namespace Database\Seeders;

use App\Models\QrCode;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class QrCodeSeeder extends Seeder
{
    public function run(): void
    {
        $qrCode = QrCode::firstWhere('type', 'centre');

        QrCode::updateOrCreate(
            ['type' => 'centre'],
            [
                'token' => $qrCode->token ?? Str::random(40),
                'actif' => true,
                'evenement_id' => null,
            ]
        );
    }
}
