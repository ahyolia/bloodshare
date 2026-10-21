<?php

namespace App\Filament\Resources\AdminResource\Pages;

use App\Filament\Resources\AdminResource;
use Filament\Actions;
use Filament\Forms;
use Filament\Resources\Pages\ViewRecord;

class ViewAdmin extends ViewRecord
{
    protected static string $resource = AdminResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\EditAction::make()
                ->label('Modifier'),

            Actions\Action::make('suspendre')
                ->label('Suspendre')
                ->color('warning')
                ->icon('heroicon-o-no-symbol')
                // 📖 Jamais sur son propre compte : le super_admin se fermerait l'accès au BO.
                ->visible(fn (): bool => $this->record->statut === 'actif' && ! $this->record->is(auth()->user()))
                ->form([
                    Forms\Components\TextInput::make('motif')
                        ->label('Motif de suspension')
                        ->required(),
                ])
                ->action(function (array $data): void {
                    $this->record->suspendre($data['motif']);
                }),

            Actions\Action::make('reactiver')
                ->label('Réactiver')
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
                ->label('Supprimer')
                ->color('danger')
                ->icon('heroicon-o-trash')
                ->visible(fn (): bool => ! $this->record->is(auth()->user()))
                ->requiresConfirmation()
                ->modalDescription('Cette action est irréversible.')
                ->action(function (): void {
                    // 📖 Même suppression que pour un donneur (rôles retirés, tokens révoqués,
                    //    données effacées) : delete() effaçait la ligne, à la différence de
                    //    tous les autres chemins de suppression.
                    $this->record->anonymiser();
                    $this->redirect(AdminResource::getUrl('index'));
                }),
        ];
    }
}
