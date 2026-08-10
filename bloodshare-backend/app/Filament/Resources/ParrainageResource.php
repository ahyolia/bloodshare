<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ParrainageResource\Pages;
use App\Models\Parrainage;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class ParrainageResource extends Resource
{
    protected static ?string $model = Parrainage::class;

    protected static ?string $navigationIcon = 'heroicon-o-user-plus';
    protected static ?string $navigationGroup = 'Utilisateurs';
    protected static ?string $navigationLabel = 'Parrainages';
    protected static ?string $modelLabel = 'parrainage';
    protected static ?string $pluralModelLabel = 'Parrainages';

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('parrain.pseudo')
                    ->label('Parrain')
                    ->searchable(),

                Tables\Columns\TextColumn::make('filleul.pseudo')
                    ->label('Filleul')
                    ->searchable(),

                Tables\Columns\BadgeColumn::make('statut')
                    ->label('Statut')
                    ->colors([
                        'warning' => 'en_attente',
                        'success' => 'valide',
                    ])
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'en_attente' => 'En attente',
                        'valide' => 'Validé',
                        default => $state,
                    }),

                Tables\Columns\TextColumn::make('valide_at')
                    ->label('Validé le')
                    ->date('d/m/Y')
                    ->default('—'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Créé le')
                    ->date('d/m/Y'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('statut')
                    ->label('Statut')
                    ->options([
                        'en_attente' => 'En attente',
                        'valide' => 'Validé',
                    ]),
            ])
            ->actions([
                Tables\Actions\DeleteAction::make()
                    ->label('Supprimer')
                    ->requiresConfirmation(),
            ])
            ->bulkActions([
                //
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListParrainages::route('/'),
        ];
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function canEdit($record): bool
    {
        return false;
    }
}
