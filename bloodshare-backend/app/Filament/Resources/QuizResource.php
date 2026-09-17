<?php

namespace App\Filament\Resources;

use App\Filament\Resources\QuizResource\Pages;
use App\Filament\Resources\QuizResource\RelationManagers;
use App\Models\Quiz;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use Illuminate\Support\Facades\Auth;

class QuizResource extends Resource
{
    protected static ?string $model = Quiz::class;

    protected static ?string $navigationIcon = 'heroicon-o-rectangle-stack';

    protected static ?string $navigationGroup = 'Gamification';

    protected static ?string $navigationLabel = 'Quiz';

    protected static ?string $modelLabel = 'quiz';

    protected static ?string $pluralModelLabel = 'Quiz';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('titre')
                    ->required()
                    ->maxLength(255),
                Forms\Components\Textarea::make('description')
                    ->columnSpanFull(),
                Forms\Components\Toggle::make('aleatoire')
                    ->required(),
                Forms\Components\TextInput::make('points_attribues')
                    ->required()
                    ->numeric()
                    ->default(0),
                Forms\Components\Select::make('statut')
                    ->label('Statut')
                    ->options([
                        'brouillon' => 'Brouillon',
                        'actif' => 'Actif',
                        'inactif' => 'Inactif',
                    ])
                    ->required()
                    ->default('brouillon'),
                // 📖 Options figées sur les catégories réellement utilisées par les quiz
                //    du BO (mêmes 3 vues sur les quiz existants) : évite les doublons du
                //    style "Les bases du don" / "les bases du don" qui casseraient le
                //    regroupement par catégorie côté mobile.
                Forms\Components\Select::make('categorie')
                    ->label('Catégorie')
                    ->options([
                        'Les bases du don' => 'Les bases du don',
                        'Les groupes sanguins' => 'Les groupes sanguins',
                        "L'association ADSB-NC" => "L'association ADSB-NC",
                    ]),
                Forms\Components\Hidden::make('admin_id')
                    ->default(fn () => Auth::id()),
                Forms\Components\Repeater::make('questions')
                    ->relationship('questions')
                    ->label('Questions')
                    // 📖 orderColumn : Filament gère lui-même la colonne `ordre` via le
                    //    glisser-déposer natif du Repeater — plus besoin de le saisir à la
                    //    main (source de confusion), l'API /quiz/{id} qui trie par `ordre`
                    //    reste alimentée correctement quand le quiz n'est pas aléatoire.
                    ->orderColumn('ordre')
                    ->collapsible()
                    ->collapsed()
                    ->itemLabel(fn (array $state): ?string => $state['intitule'] ?? null)
                    ->schema([
                        Forms\Components\TextInput::make('intitule')
                            ->required()
                            ->maxLength(255),
                        Forms\Components\Select::make('type')
                            ->options([
                                'unique' => 'Réponse unique',
                                'multiple' => 'Réponses multiples',
                            ])
                            ->required()
                            ->default('unique'),
                        Forms\Components\Toggle::make('aleatoire')
                            ->label('Réponses aléatoires'),
                        Forms\Components\Repeater::make('reponses')
                            ->relationship('reponses')
                            ->label('Réponses')
                            ->collapsible()
                            ->collapsed()
                            ->itemLabel(fn (array $state): ?string => $state['texte'] ?? null)
                            ->schema([
                                Forms\Components\TextInput::make('texte')
                                    ->required()
                                    ->maxLength(255),
                                Forms\Components\Toggle::make('est_correcte')
                                    ->label('Correcte'),
                            ])
                            ->columns(2)
                            ->defaultItems(2),
                    ])
                    ->columnSpanFull()
                    ->defaultItems(1),
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
                Tables\Columns\IconColumn::make('aleatoire')
                    ->boolean(),
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
                Tables\Columns\TextColumn::make('categorie')
                    ->searchable(),
                Tables\Columns\TextColumn::make('questions_count')
                    ->label('Questions')
                    ->getStateUsing(fn ($record) => $record->questions()->count())
                    ->sortable(false),
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
            'index' => Pages\ListQuizzes::route('/'),
            'create' => Pages\CreateQuiz::route('/create'),
            'edit' => Pages\EditQuiz::route('/{record}/edit'),
        ];
    }
}
