<?php

namespace App\Filament\Resources;

use App\Filament\Resources\DefiResource\Pages;
use App\Filament\Resources\DefiResource\RelationManagers;
use App\Models\Defi;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use Illuminate\Support\Facades\Auth;

class DefiResource extends Resource
{
    protected static ?string $model = Defi::class;

    protected static ?string $navigationIcon = 'heroicon-o-rectangle-stack';

    protected static ?string $navigationGroup = 'Gamification';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('titre')
                    ->required()
                    ->maxLength(255),
                Forms\Components\Textarea::make('description')
                    ->columnSpanFull(),
                Forms\Components\TextInput::make('objectif_chiffre')
                    ->numeric(),
                Forms\Components\DatePicker::make('date_fin')
                    ->label('Date de fin'),
                Forms\Components\TextInput::make('points_attribues')
                    ->required()
                    ->numeric()
                    ->default(0),
                Forms\Components\Select::make('statut')
                    ->label('Statut')
                    ->options([
                        'brouillon' => 'Brouillon',
                        'actif' => 'Actif',
                        'termine' => 'Terminé',
                    ])
                    ->required()
                    ->default('brouillon'),

                // 📖 Seules valeurs autorisées par les contraintes CHECK en BDD
                // depuis la refacto "défis communautaires uniquement" (migration
                // du 10/06/2026) : pas de choix à faire, on les fige.
                Forms\Components\Hidden::make('type')
                    ->default('communautaire'),
                Forms\Components\Hidden::make('periode')
                    ->default('mensuel'),

                Forms\Components\Hidden::make('admin_id')
                    ->default(fn () => Auth::id()),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('admin_id')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('titre')
                    ->searchable(),
                Tables\Columns\TextColumn::make('type')
                    ->searchable(),
                Tables\Columns\TextColumn::make('periode')
                    ->searchable(),
                Tables\Columns\TextColumn::make('objectif_chiffre')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('date_fin')
                    ->label('Date de fin')
                    ->date('d/m/Y')
                    ->sortable(),
                Tables\Columns\TextColumn::make('points_attribues')
                    ->numeric()
                    ->sortable(),
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
                Tables\Actions\EditAction::make(),
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
            'index' => Pages\ListDefis::route('/'),
            'create' => Pages\CreateDefi::route('/create'),
            'edit' => Pages\EditDefi::route('/{record}/edit'),
        ];
    }
}
