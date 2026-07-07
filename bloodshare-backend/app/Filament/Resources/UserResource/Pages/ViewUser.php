<?php

namespace App\Filament\Resources\UserResource\Pages;

use App\Filament\Resources\UserResource;
use Filament\Actions;
use Filament\Forms;
use Filament\Resources\Pages\ViewRecord;

class ViewUser extends ViewRecord
{
    protected static string $resource = UserResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('suspendre')
                ->label('Suspendre le compte')
                ->color('warning')
                ->icon('heroicon-o-no-symbol')
                ->visible(fn (): bool => $this->record->statut === 'actif')
                ->form([
                    Forms\Components\TextInput::make('motif')
                        ->label('Motif de suspension')
                        ->required(),
                ])
                ->action(function (array $data): void {
                    $this->record->update([
                        'statut' => 'suspendu',
                        'motif_suspension' => $data['motif'],
                    ]);
                }),

            Actions\Action::make('reactiver')
                ->label('Réactiver le compte')
                ->color('success')
                ->icon('heroicon-o-check-circle')
                ->visible(fn (): bool => $this->record->statut === 'suspendu')
                ->requiresConfirmation()
                ->action(function (): void {
                    $this->record->update([
                        'statut' => 'actif',
                        'motif_suspension' => null,
                    ]);
                }),

            Actions\Action::make('supprimer')
                ->label('Supprimer le compte')
                ->color('danger')
                ->icon('heroicon-o-trash')
                ->visible(fn (): bool => $this->record->statut !== 'supprime')
                ->requiresConfirmation()
                ->modalDescription('Cette action est irréversible.')
                ->action(function (): void {
                    $this->record->update(['statut' => 'supprime']);
                }),
        ];
    }
}
