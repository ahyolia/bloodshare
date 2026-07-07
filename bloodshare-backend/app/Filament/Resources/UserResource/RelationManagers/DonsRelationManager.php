<?php

namespace App\Filament\Resources\UserResource\RelationManagers;

use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class DonsRelationManager extends RelationManager
{
    protected static string $relationship = 'dons';

    protected static ?string $title = 'Historique des dons';

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('date_don')
            ->columns([
                Tables\Columns\TextColumn::make('date_don')
                    ->label('Date du don')
                    ->date('d/m/Y'),

                Tables\Columns\BadgeColumn::make('statut')
                    ->label('Statut'),
            ])
            ->defaultSort('date_don', 'desc')
            ->headerActions([
                //
            ])
            ->actions([
                //
            ])
            ->bulkActions([
                //
            ]);
    }
}
