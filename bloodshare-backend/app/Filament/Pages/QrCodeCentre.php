<?php

namespace App\Filament\Pages;

use App\Models\QrCode;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode as QrCodeGenerator;

class QrCodeCentre extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-qr-code';
    protected static ?string $navigationGroup = 'Communication';
    protected static ?string $navigationLabel = 'QR Code centre';
    protected static ?string $title = 'QR Code du centre';
    protected static string $view = 'filament.pages.qr-code-centre';

    public ?QrCode $qrCode = null;
    public string $qrSvg = '';

    public function mount(): void
    {
        $this->qrCode = QrCode::where('type', 'centre')->where('actif', true)->first();

        if (! $this->qrCode) {
            $this->qrCode = QrCode::create([
                'type'  => 'centre',
                'token' => Str::random(40),
                'actif' => true,
            ]);
        }

        $this->qrSvg = $this->generateSvg($this->qrCode->token);
    }

    protected function getHeaderActions(): array
    {
        return [
            Action::make('regenerer')
                ->label('Régénérer le QR Code')
                ->icon('heroicon-o-arrow-path')
                ->color('danger')
                ->requiresConfirmation()
                ->modalHeading('Régénérer le QR Code ?')
                ->modalDescription('L\'ancien QR Code sera invalidé et tous les liens existants ne fonctionneront plus.')
                ->modalSubmitActionLabel('Oui, régénérer')
                ->action(function () {
                    // Invalide l'ancien
                    if ($this->qrCode) {
                        $this->qrCode->update(['actif' => false]);
                    }

                    // Crée le nouveau
                    $this->qrCode = QrCode::create([
                        'id'    => (string) Str::uuid(),
                        'type'  => 'centre',
                        'token' => Str::random(40),
                        'actif' => true,
                    ]);

                    $this->qrSvg = $this->generateSvg($this->qrCode->token);

                    Notification::make()
                        ->title('QR Code régénéré avec succès')
                        ->success()
                        ->send();
                }),

            Action::make('telecharger')
                ->label('Télécharger (PNG)')
                ->icon('heroicon-o-arrow-down-tray')
                ->color('success')
                ->url(route('qrcode.centre.download'))
                ->openUrlInNewTab(),
        ];
    }

    private function generateSvg(string $token): string
    {
        return QrCodeGenerator::format('svg')
            ->size(300)
            ->errorCorrection('H')
            ->generate($token);
    }
}
