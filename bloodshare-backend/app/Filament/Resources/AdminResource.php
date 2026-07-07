<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AdminResource\Pages;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Infolists\Infolist;
use Filament\Infolists\Components\Section as InfolistSection;
use Filament\Infolists\Components\TextEntry;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class AdminResource extends Resource
{
    protected static ?string $model = User::class;

    protected static ?string $navigationIcon = 'heroicon-o-shield-check';
    protected static ?string $navigationGroup = 'Administration';
    protected static ?string $navigationLabel = 'Gestion des admins';
    protected static ?string $modelLabel = 'admin';
    protected static ?string $pluralModelLabel = 'Admins';

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->whereHas('roles', fn ($q) => $q->whereIn('name', ['admin', 'super_admin']));
    }

    public static function canViewAny(): bool
    {
        return auth()->user()->hasRole('super_admin');
    }

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
                    ->unique(ignoreRecord: true)
                    ->maxLength(255),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('pseudo')
                    ->label('Pseudo')
                    ->searchable(),

                Tables\Columns\TextColumn::make('email')
                    ->label('Email')
                    ->searchable(),

                Tables\Columns\BadgeColumn::make('role')
                    ->label('Rôle')
                    ->getStateUsing(fn ($record) => $record->getRoleNames()->first() ?? '—')
                    ->colors([
                        'info' => 'admin',
                        'danger' => 'super_admin',
                    ]),

                Tables\Columns\BadgeColumn::make('statut')
                    ->label('Statut')
                    ->colors([
                        'success' => 'actif',
                        'warning' => 'suspendu',
                    ]),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Créé le')
                    ->date('d/m/Y')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('role')
                    ->label('Rôle')
                    ->options([
                        'admin' => 'Admin',
                        'super_admin' => 'Super admin',
                    ])
                    ->query(function (Builder $query, array $data) {
                        if (! $data['value']) {
                            return $query;
                        }

                        return $query->whereHas('roles', fn ($q) => $q->where('name', $data['value']));
                    }),

                Tables\Filters\SelectFilter::make('statut')
                    ->label('Statut')
                    ->options([
                        'actif' => 'Actif',
                        'suspendu' => 'Suspendu',
                    ]),
            ])
            ->actions([
                Tables\Actions\ViewAction::make()->label('Voir'),
                Tables\Actions\EditAction::make()->label('Modifier'),
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
                        TextEntry::make('email')->label('Email'),
                        TextEntry::make('statut')
                            ->label('Statut')
                            ->badge()
                            ->color(fn (string $state): string => match ($state) {
                                'actif' => 'success',
                                'suspendu' => 'warning',
                                default => 'gray',
                            }),
                    ])
                    ->columns(3),

                InfolistSection::make('Droits & périmètre')
                    ->schema([
                        TextEntry::make('roles_list')
                            ->label('Rôle')
                            ->getStateUsing(fn ($record) => $record->getRoleNames()->join(', ')),
                    ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListAdmins::route('/'),
            'create' => Pages\CreateAdmin::route('/create'),
            'view' => Pages\ViewAdmin::route('/{record}'),
            'edit' => Pages\EditAdmin::route('/{record}/edit'),
        ];
    }
}
