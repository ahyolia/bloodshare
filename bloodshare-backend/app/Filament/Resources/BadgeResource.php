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

    // 📖 Une seule source de vérité pour les libellés, réutilisée dans le formulaire et dans
    //    la liste — un badge dont l'action ne serait pas dans cette liste (pas encore branchée
    //    dans BadgeService) s'affiche avec sa valeur brute (cf. formatStateUsing plus bas).
    private const ACTIONS_SPECIFIQUES = [
        'premier_don' => 'Premier don validé',
        'premier_parrainage' => 'Premier parrainage validé',
        'trois_parrainages' => '3 parrainages validés',
        'inscrit_avec_code' => "Inscription avec un code de parrainage",
        'premier_quiz' => 'Premier quiz terminé',
        'cinq_quiz' => '5 quiz terminés',
        'toutes_categories_quiz' => 'Tous les quiz actifs terminés',
        'six_cartes_mois' => '6 cartes « Mois du don » obtenues',
        'douze_cartes_mois' => '12 cartes « Mois du don » obtenues',
        'trois_cartes_evenement' => '3 cartes « Événement » obtenues',
    ];

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

                // 📖 Un champ texte libre laissait saisir n'importe quelle valeur, y compris une
                //    faute de frappe silencieuse (« premier_dons » au lieu de « premier_don ») :
                //    le badge ne serait alors jamais attribué, sans aucune erreur visible. Les
                //    seules valeurs qui déclenchent réellement quelque chose sont celles vérifiées
                //    dans BadgeService::synchroniser() — on ne peut donc choisir que parmi elles.
                Forms\Components\Select::make('action_specifique')
                    ->label('Action spécifique')
                    ->options(self::ACTIONS_SPECIFIQUES)
                    ->helperText('Condition vérifiée par BadgeService à chaque scan, quiz, parrainage ou consultation des badges.')
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
                    ->default('—')
                    ->formatStateUsing(fn (?string $state): string => $state
                        ? (self::ACTIONS_SPECIFIQUES[$state] ?? $state)
                        : '—'),

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
