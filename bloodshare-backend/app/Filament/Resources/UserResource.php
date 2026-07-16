<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserResource\Pages;
use App\Filament\Resources\UserResource\RelationManagers;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Infolists\Infolist;
use Filament\Infolists\Components\Section as InfolistSection;
use Filament\Infolists\Components\TextEntry;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class UserResource extends Resource
{
    protected static ?string $model = User::class;

    protected static ?string $navigationIcon = 'heroicon-o-users';
    protected static ?string $navigationGroup = 'Utilisateurs';
    protected static ?string $navigationLabel = 'Utilisateurs';
    protected static ?string $modelLabel = 'utilisateur';
    protected static ?string $pluralModelLabel = 'Utilisateurs';

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('avatar.image_url')
                    ->label('Avatar')
                    ->circular()
                    ->default(null),

                Tables\Columns\TextColumn::make('pseudo')
                    ->label('Pseudo')
                    ->searchable(),

                Tables\Columns\TextColumn::make('statut_donneur')
                    ->label('Statut donneur')
                    ->formatStateUsing(fn ($state) => match($state) {
                        'donneur_regulier' => 'Donneur régulier',
                        'quelques_dons'    => 'Quelques dons',
                        'jamais_donne'     => 'Jamais donné',
                        default            => '—'
                    }),

                Tables\Columns\TextColumn::make('points_cumules')
                    ->label('Points')
                    ->sortable(),

                Tables\Columns\BadgeColumn::make('statut')
                    ->label('Statut')
                    ->colors([
                        'success' => 'actif',
                        'warning' => 'suspendu',
                        'danger' => 'supprime',
                    ]),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Inscrit le')
                    ->date('d/m/Y')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('statut')
                    ->label('Statut')
                    ->options([
                        'actif' => 'Actif',
                        'suspendu' => 'Suspendu',
                        'supprime' => 'Supprimé',
                    ]),
                Tables\Filters\SelectFilter::make('statut_donneur')
                    ->options([
                        'donneur_regulier' => 'Donneur régulier',
                        'quelques_dons'    => 'Quelques dons',
                        'jamais_donne'     => 'Jamais donné',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make()->label('Voir'),
            ])
            ->bulkActions([
                //
            ]);
    }

    public static function infolist(Infolist $infolist): Infolist
    {
        return $infolist
            ->schema([
                InfolistSection::make('Informations')
                    ->schema([
                        TextEntry::make('pseudo')->label('Pseudo'),
                        TextEntry::make('statut_donneur')
                            ->label('Statut donneur')
                            ->formatStateUsing(fn ($state) => match($state) {
                                'donneur_regulier' => '🩸 Donneur régulier',
                                'quelques_dons'    => '💧 Quelques dons',
                                'jamais_donne'     => '🆕 Jamais donné',
                                default            => '—'
                            }),
                        TextEntry::make('sexe')->label('Sexe'),
                        TextEntry::make('points_cumules')->label('Points cumulés'),
                        TextEntry::make('created_at')
                            ->label("Date d'inscription")
                            ->date('d/m/Y'),
                        TextEntry::make('derniere_connexion')
                            ->label('Dernière connexion')
                            ->dateTime('d/m/Y H:i')
                            ->default('—'),
                    ])
                    ->columns(3),

                InfolistSection::make('Statut du compte')
                    ->schema([
                        TextEntry::make('statut')
                            ->label('Statut')
                            ->badge()
                            ->color(fn (string $state): string => match ($state) {
                                'actif' => 'success',
                                'suspendu' => 'warning',
                                'supprime' => 'danger',
                                default => 'gray',
                            }),
                        TextEntry::make('motif_suspension')
                            ->label('Motif de suspension')
                            ->visible(fn (User $record): bool => $record->statut === 'suspendu')
                            ->default('—'),
                    ])
                    ->columns(2),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            RelationManagers\DonsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListUsers::route('/'),
            'view' => Pages\ViewUser::route('/{record}'),
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

    public static function canDelete($record): bool
    {
        return false;
    }
}
