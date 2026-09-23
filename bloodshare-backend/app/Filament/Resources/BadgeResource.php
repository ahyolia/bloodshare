<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BadgeResource\Pages;
use App\Models\Badge;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class BadgeResource extends Resource
{
    protected static ?string $model = Badge::class;
    protected static ?string $navigationIcon = 'heroicon-o-rectangle-stack';
    protected static ?string $navigationGroup = 'Gamification';
    protected static ?string $navigationLabel = 'Badges';
    protected static ?string $modelLabel = 'badge';
    protected static ?string $pluralModelLabel = 'Badges';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('nom')
                    ->label('Nom')
                    ->required()
                    ->maxLength(255),

                Forms\Components\FileUpload::make('image_url')
                    ->label('Image')
                    ->image()
                    ->directory('badges')
                    ->columnSpanFull(),

                // 📖 Deux façons de déclencher un badge : un seuil numérique (nombre de
                //    dons, par exemple), ou une action précise repérée ailleurs dans le
                //    code (ex. « premier_don », « premier_parrainage »). Un seul champ ne
                //    suffit pas à décrire les deux, d'où ce choix qui affiche l'un ou l'autre.
                Forms\Components\Select::make('condition_type')
                    ->label('Type de condition')
                    ->options([
                        'nb_dons' => 'Nombre de dons',
                        'action_specifique' => 'Action spécifique',
                    ])
                    ->required()
                    ->live(),

                Forms\Components\TextInput::make('condition_valeur')
                    ->label('Seuil à atteindre')
                    ->numeric()
                    ->nullable()
                    ->visible(fn ($get) => $get('condition_type') === 'nb_dons')
                    ->required(fn ($get) => $get('condition_type') === 'nb_dons'),

                Forms\Components\TextInput::make('action_specifique')
                    ->label('Action spécifique')
                    ->helperText('Identifiant technique vérifié dans le code (ex. premier_don, premier_parrainage).')
                    ->maxLength(255)
                    ->nullable()
                    ->visible(fn ($get) => $get('condition_type') === 'action_specifique')
                    ->required(fn ($get) => $get('condition_type') === 'action_specifique'),

                Forms\Components\Select::make('statut')
                    ->label('Statut')
                    ->options([
                        'actif' => 'Actif',
                        'inactif' => 'Inactif',
                    ])
                    ->required()
                    ->default('actif'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('image_url')
                    ->label('Image')
                    ->size(48),

                Tables\Columns\TextColumn::make('nom')
                    ->label('Nom')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('condition_type')
                    ->label('Condition')
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'nb_dons' => 'Nombre de dons',
                        'action_specifique' => 'Action spécifique',
                        default => $state,
                    }),

                Tables\Columns\TextColumn::make('condition_valeur')
                    ->label('Seuil')
                    ->default('—')
                    ->numeric(),

                Tables\Columns\TextColumn::make('action_specifique')
                    ->label('Action')
                    ->default('—'),

                Tables\Columns\BadgeColumn::make('statut')
                    ->label('Statut')
                    ->colors([
                        'success' => 'actif',
                        'gray' => 'inactif',
                    ])
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'actif' => 'Actif',
                        'inactif' => 'Inactif',
                        default => $state,
                    }),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('condition_type')
                    ->label('Condition')
                    ->options([
                        'nb_dons' => 'Nombre de dons',
                        'action_specifique' => 'Action spécifique',
                    ]),
                Tables\Filters\SelectFilter::make('statut')
                    ->label('Statut')
                    ->options([
                        'actif' => 'Actif',
                        'inactif' => 'Inactif',
                    ]),
            ])
            ->actions([
                Tables\Actions\Action::make('toggle')
                    ->label(fn (Badge $record): string => $record->statut === 'actif' ? 'Désactiver' : 'Activer')
                    ->icon(fn (Badge $record): string => $record->statut === 'actif' ? 'heroicon-o-eye-slash' : 'heroicon-o-eye')
                    ->color(fn (Badge $record): string => $record->statut === 'actif' ? 'warning' : 'success')
                    ->action(fn (Badge $record) => $record->update([
                        'statut' => $record->statut === 'actif' ? 'inactif' : 'actif',
                    ])),
                Tables\Actions\EditAction::make()
                    ->label('Modifier'),
                Tables\Actions\DeleteAction::make()
                    ->label('Supprimer'),
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
            'index' => Pages\ListBadges::route('/'),
            'create' => Pages\CreateBadge::route('/create'),
            'edit' => Pages\EditBadge::route('/{record}/edit'),
        ];
    }
}
