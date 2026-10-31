<?php

namespace App\Filament\Pages;

use App\Models\QrCode;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class QrCodeCentre extends Page
{
    protected static ?string $navigationIcon = 'heroicon-o-qr-code';
    protected static ?string $navigationGroup = 'Communication';
    protected static ?string $navigationLabel = 'QR Code centre';
    protected static ?string $title = 'QR Code du centre';
    protected static string $view = 'filament.pages.qr-code-centre';

    public ?QrCode $qrCode = null;

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
    }

    // 📖 Le token n'est plus affiché ici ni encodé dans un QR : c'est la clé qui signe le
    //    QR tournant (voir QrCentreTournant). Seul le lien de l'écran du centre est montré.
    public function getLienAffichage(): string
    {
        return url(URL::signedRoute('qrcode.centre.affichage', ['qrCode' => $this->qrCode], absolute: false));
    }

    // 📖 En haut : les actions qui changent l'état du QR (mode secours, régénération). Les
    //    autres sont dans la section qu'elles concernent (vue qr-code-centre.blade.php).
    //    Activer / Désactiver restent ici : une action rendue directement dans la vue
    //    ignore visible(), et les deux boutons s'affichaient en même temps.
    protected function getHeaderActions(): array
    {
        return [
            Action::make('activerSecours')
                ->label('Activer le mode secours')
                ->icon('heroicon-o-lifebuoy')
                ->color('warning')
                ->visible(fn () => ! $this->qrCode->secoursActif())
                ->requiresConfirmation()
                ->modalHeading('Activer le QR de secours ?')
                ->modalDescription("Le QR Code imprimé sera accepté jusqu'à ce soir 23h59. Pendant ce temps, une photo de ce QR permet de valider un don sans être au centre : à n'utiliser que si l'écran est en panne.")
                ->modalSubmitActionLabel('Activer')
                ->action(function () {
                    $this->qrCode->update(['secours_jusqu_a' => now()->endOfDay()]);

                    Notification::make()->title("QR de secours actif jusqu'à ce soir 23h59")->warning()->send();
                }),

            Action::make('desactiverSecours')
                ->label('Désactiver le mode secours')
                ->icon('heroicon-o-lifebuoy')
                ->color('success')
                ->visible(fn () => $this->qrCode->secoursActif())
                ->action(function () {
                    $this->qrCode->update(['secours_jusqu_a' => null]);

                    Notification::make()->title('QR de secours désactivé')->success()->send();
                }),

            Action::make('regenerer')
                ->label('Régénérer le QR Code')
                ->icon('heroicon-o-arrow-path')
                ->color('danger')
                ->requiresConfirmation()
                ->modalHeading('Régénérer le QR Code ?')
                ->modalDescription("L'écran du centre affichera une erreur : il faudra l'ouvrir avec le nouveau lien. Le QR de secours imprimé ne fonctionnera plus non plus. À faire si le lien ou le QR de secours a pu être partagé.")
                ->modalSubmitActionLabel('Oui, régénérer')
                ->action(function () {
                    if ($this->qrCode) {
                        $this->qrCode->update(['actif' => false]);
                    }

                    $this->qrCode = QrCode::create([
                        'id'    => (string) Str::uuid(),
                        'type'  => 'centre',
                        'token' => Str::random(40),
                        'actif' => true,
                    ]);

                    Notification::make()
                        ->title('QR Code régénéré : ouvre le nouveau lien sur l\'écran du centre')
                        ->success()
                        ->send();
                }),
        ];
    }

    // ── Section « Lien de l'écran du centre » ───────────────────

    public function ouvrirAffichageAction(): Action
    {
        return Action::make('ouvrirAffichage')
            ->label("Ouvrir l'affichage")
            ->icon('heroicon-o-tv')
            ->url(fn () => $this->getLienAffichage())
            ->openUrlInNewTab();
    }

    // ── Section « QR de secours » ───────────────────────────────

    public function imprimerSecoursAction(): Action
    {
        return Action::make('imprimerSecours')
            ->label('Imprimer')
            ->icon('heroicon-o-printer')
            ->color('gray')
            ->url(fn () => route('qrcode.telecharger', ['qrCode' => $this->qrCode, 'format' => 'pdf', 'imprimer' => 1]))
            ->openUrlInNewTab();
    }

    // 📖 PNG et PDF regroupés dans un menu « Télécharger » (vue), pour alléger la section.
    public function telechargerSecoursPngAction(): Action
    {
        return Action::make('telechargerSecoursPng')
            ->label('PNG')
            ->url(fn () => route('qrcode.telecharger', ['qrCode' => $this->qrCode, 'format' => 'png']));
    }

    public function telechargerSecoursPdfAction(): Action
    {
        return Action::make('telechargerSecoursPdf')
            ->label('PDF')
            ->url(fn () => route('qrcode.telecharger', ['qrCode' => $this->qrCode, 'format' => 'pdf']));
    }
}
