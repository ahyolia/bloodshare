<?php

namespace App\Http\Controllers;

use App\Models\QrCode;
use SimpleSoftwareIO\QrCode\Facades\QrCode as QrCodeGenerator;

class QrCodeCentreController extends Controller
{
    public function download()
    {
        $qrCode = QrCode::where('type', 'centre')->where('actif', true)->first();

        abort_if(! $qrCode, 404, 'Aucun QR Code centre actif.');

        $png = QrCodeGenerator::format('png')
            ->size(600)
            ->errorCorrection('H')
            ->generate($qrCode->token);

        return response($png, 200, [
            'Content-Type'        => 'image/png',
            'Content-Disposition' => 'attachment; filename="qrcode-centre.png"',
        ]);
    }
}
