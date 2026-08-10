<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BadgeResource\Pages;
use App\Filament\Resources\BadgeResource\RelationManagers;
use App\Models\Badge;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class BadgeResource extends Resource
{
    protected static ?string $model = Badge::class;

    protected static ?string $navigationIcon = 'heroicon-o-rectangle-stack';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('nom')
                    ->required()
                    ->maxLength(255),
                Forms\Components\FileUpload::make('image_url')
                    ->image(),
                Forms\Components\TextInput::make('condition_type')
                    ->required()
                    ->maxLength(255)
                    ->live(),
                Forms\Components\TextInput::make('condition_valeur')
                    ->numeric()
                    ->nullable()
                    ->visible(fn ($get) => $get('condition_type') !== 'action_specifique'
                        && $get('condition_type') !== null),
                Forms\Components\TextInput::make('action_specifique')
                    ->maxLength(255)
                    ->nullable()
                    ->visible(fn ($get) => $get('condition_type') === 'action_specifique'),
                Forms\Components\TextInput::make('statut')
                    ->required()
                    ->maxLength(255)
                    ->default('actif'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('nom')
                    ->searchable(),
                Tables\Columns\ImageColumn::make('image_url'),
                Tables\Columns\TextColumn::make('condition_type')
                    ->searchable(),
                Tables\Columns\TextColumn::make('condition_valeur')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('action_specifique')
                    ->searchable(),
                Tables\Columns\TextColumn::make('statut')
                    ->searchable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->actions([
                Tables\Actions\Action::make('toggle')
                    ->label(fn (Badge $record): string => $record->statut === 'actif' ? 'Désactiver' : 'Activer')
                    ->icon(fn (Badge $record): string => $record->statut === 'actif' ? 'heroicon-o-eye-slash' : 'heroicon-o-eye')
                    ->color(fn (Badge $record): string => $record->statut === 'actif' ? 'warning' : 'success')
                    ->action(fn (Badge $record) => $record->update([
                        'statut' => $record->statut === 'actif' ? 'inactif' : 'actif',
                    ])),
                Tables\Actions\EditAction::make()->label('Modifier'),
                Tables\Actions\DeleteAction::make()->label('Supprimer'),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListBadges::route('/'),
            'create' => Pages\CreateBadge::route('/create'),
            'edit' => Pages\EditBadge::route('/{record}/edit'),
        ];
    }
}
