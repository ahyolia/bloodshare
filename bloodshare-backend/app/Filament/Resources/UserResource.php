<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserResource\Pages;
use App\Models\User;
use App\Services\NiveauService;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Infolists\Components\TextEntry;
use Filament\Infolists\Infolist;
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

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('pseudo')
                    ->label('Pseudo')
                    ->required()
                    ->maxLength(255),

                Forms\Components\TextInput::make('email')
                    ->label('Email')
                    ->email()
                    ->required()
                    ->maxLength(255),

                Forms\Components\Select::make('statut')
                    ->label('Statut')
                    ->options([
                        'actif'    => 'Actif',
                        'suspendu' => 'Suspendu',
                    ])
                    ->required()
                    ->default('actif'),

                Forms\Components\Textarea::make('motif_suspension')
                    ->label('Motif de suspension')
                    ->rows(3)
                    ->columnSpanFull(),
            ]);
    }

    public static function infolist(Infolist $infolist): Infolist
    {
        return $infolist
            ->schema([
                TextEntry::make('pseudo')
                    ->label('Pseudo'),

                TextEntry::make('email')
                    ->label('Email'),

                TextEntry::make('statut')
                    ->label('Statut'),

                TextEntry::make('points_cumules')
                    ->label('Points cumulés'),

                TextEntry::make('niveau')
                    ->label('Niveau')
                    ->getStateUsing(fn ($record) => match (true) {
                        default => (function () use ($record) {
                            $n = NiveauService::calculerNiveau($record->points_cumules ?? 0);

                            return "Niveau {$n['niveau']} — {$n['label']} ({$n['progression']}% vers niveau suivant)";
                        })()
                    }),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('pseudo')
                    ->label('Pseudo')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('email')
                    ->label('Email')
                    ->searchable(),

                Tables\Columns\TextColumn::make('points_cumules')
                    ->label('Points cumulés')
                    ->sortable(),

                Tables\Columns\TextColumn::make('niveau')
                    ->label('Niveau')
                    ->getStateUsing(fn ($record) =>
                        'Niv. ' .
                        NiveauService::calculerNiveau($record->points_cumules ?? 0)['niveau'] .
                        ' — ' .
                        NiveauService::calculerNiveau($record->points_cumules ?? 0)['label']
                    )
                    ->badge()
                    ->color(fn ($record) => match (
                        NiveauService::calculerNiveau($record->points_cumules ?? 0)['niveau']
                    ) {
                        1 => 'gray',
                        2 => 'info',
                        3 => 'warning',
                        4 => 'success',
                        5 => 'danger',
                    }),

                Tables\Columns\BadgeColumn::make('statut')
                    ->label('Statut')
                    ->colors([
                        'success' => 'actif',
                        'danger'  => 'suspendu',
                    ]),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Inscrit le')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('statut')
                    ->label('Statut')
                    ->options([
                        'actif'    => 'Actif',
                        'suspendu' => 'Suspendu',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListUsers::route('/'),
            'create' => Pages\CreateUser::route('/create'),
            'view'   => Pages\ViewUser::route('/{record}'),
            'edit'   => Pages\EditUser::route('/{record}/edit'),
        ];
    }
}
