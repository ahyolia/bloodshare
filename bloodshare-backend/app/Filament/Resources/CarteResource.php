<?php

namespace App\Filament\Resources;

use App\Filament\Resources\CarteResource\Pages;
use App\Models\Carte;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class CarteResource extends Resource
{
    protected static ?string $model = Carte::class;
    protected static ?string $navigationIcon = 'heroicon-o-sparkles';
    protected static ?string $navigationGroup = 'Gamification';
    protected static ?string $navigationLabel = 'Cartes';
    protected static ?string $modelLabel = 'carte';
    protected static ?string $pluralModelLabel = 'Cartes';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('titre')
                    ->label('Titre')
                    ->required()
                    ->maxLength(255),

                Forms\Components\Select::make('categorie')
                    ->label('Catégorie')
                    ->options([
                        'mois_don'  => '🩸 Mois du don',
                        'evenement' => '🎉 Événement',
                        'parrain'   => '🤝 Parrain',
                        'filleul'   => '🌱 Filleul',
                    ])
                    ->required()
                    ->live(),

                Forms\Components\Select::make('mois_numero')
                    ->label('Mois')
                    ->options([
                        1  => 'Janvier',
                        2  => 'Février',
                        3  => 'Mars',
                        4  => 'Avril',
                        5  => 'Mai',
                        6  => 'Juin',
                        7  => 'Juillet',
                        8  => 'Août',
                        9  => 'Septembre',
                        10 => 'Octobre',
                        11 => 'Novembre',
                        12 => 'Décembre',
                    ])
                    ->visible(fn ($get) => $get('categorie') === 'mois_don')
                    ->required(fn ($get) => $get('categorie') === 'mois_don'),

                Forms\Components\Textarea::make('description')
                    ->label('Description')
                    ->rows(4)
                    ->columnSpanFull(),

                Forms\Components\FileUpload::make('image_url')
                    ->label('Image')
                    ->image()
                    ->directory('cartes')
                    ->columnSpanFull(),

                Forms\Components\Select::make('statut')
                    ->label('Statut')
                    ->options([
                        'active'     => 'Active',
                        'desactivee' => 'Désactivée',
                    ])
                    ->required()
                    ->default('active'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('image_url')
                    ->label('Image')
                    ->size(48),

                Tables\Columns\TextColumn::make('titre')
                    ->label('Titre')
                    ->searchable()
                    ->sortable()
                    ->weight('bold')
                    ->limit(50),

                Tables\Columns\BadgeColumn::make('categorie')
                    ->label('Catégorie')
                    ->colors([
                        'danger'  => 'mois_don',
                        'success' => 'evenement',
                        'warning' => 'parrain',
                        'info'    => 'filleul',
                    ])
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'mois_don'  => '🩸 Mois du don',
                        'evenement' => '🎉 Événement',
                        'parrain'   => '🤝 Parrain',
                        'filleul'   => '🌱 Filleul',
                        default     => $state,
                    }),

                Tables\Columns\TextColumn::make('mois_numero')
                    ->label('Mois')
                    ->formatStateUsing(fn ($state): string => $state ? [
                        1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
                        5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
                        9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre',
                    ][$state] ?? '—' : '—')
                    ->default('—'),

                Tables\Columns\BadgeColumn::make('statut')
                    ->label('Statut')
                    ->colors([
                        'success' => 'active',
                        'danger'  => 'desactivee',
                    ])
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'active'     => 'Active',
                        'desactivee' => 'Désactivée',
                        default      => $state,
                    }),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Créée le')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('categorie')
                    ->label('Catégorie')
                    ->options([
                        'mois_don'  => '🩸 Mois du don',
                        'evenement' => '🎉 Événement',
                        'parrain'   => '🤝 Parrain',
                        'filleul'   => '🌱 Filleul',
                    ]),
                Tables\Filters\SelectFilter::make('statut')
                    ->label('Statut')
                    ->options([
                        'active'     => 'Active',
                        'desactivee' => 'Désactivée',
                    ]),
            ])
            ->actions([
                Tables\Actions\Action::make('toggle')
                    ->label(fn (Carte $record): string => $record->statut === 'active' ? 'Désactiver' : 'Activer')
                    ->icon(fn (Carte $record): string => $record->statut === 'active' ? 'heroicon-o-eye-slash' : 'heroicon-o-eye')
                    ->color(fn (Carte $record): string => $record->statut === 'active' ? 'warning' : 'success')
                    ->action(fn (Carte $record) => $record->update([
                        'statut' => $record->statut === 'active' ? 'desactivee' : 'active',
                    ])),
                Tables\Actions\DeleteAction::make()->label('Supprimer'),
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
            'index'  => Pages\ListCartes::route('/'),
            'create' => Pages\CreateCarte::route('/create'),
        ];
    }
}
