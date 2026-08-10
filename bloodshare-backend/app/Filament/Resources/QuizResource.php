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

class QuizResource extends Resource
{
    protected static ?string $model = Quiz::class;

    protected static ?string $navigationIcon = 'heroicon-o-rectangle-stack';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('admin_id')
                    ->numeric(),
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
                Forms\Components\TextInput::make('statut')
                    ->required()
                    ->maxLength(255)
                    ->default('brouillon'),
                Forms\Components\TextInput::make('categorie')
                    ->maxLength(255),
                Forms\Components\Repeater::make('questions')
                    ->relationship('questions')
                    ->label('Questions')
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
                        Forms\Components\TextInput::make('ordre')
                            ->numeric()
                            ->default(1),
                        Forms\Components\Toggle::make('aleatoire')
                            ->label('Réponses aléatoires'),
                        Forms\Components\Repeater::make('reponses')
                            ->relationship('reponses')
                            ->label('Réponses')
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
