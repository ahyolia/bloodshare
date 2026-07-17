<?php

namespace App\Filament\Resources;

use App\Filament\Resources\QuestionEligibiliteResource\Pages;
use App\Models\QuestionEligibilite;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class QuestionEligibiliteResource extends Resource
{
    protected static ?string $model = QuestionEligibilite::class;

    protected static ?string $navigationIcon = 'heroicon-o-clipboard-document-check';
    protected static ?string $navigationGroup = 'Contenu éditorial';
    protected static ?string $navigationLabel = 'Questionnaire éligibilité';
    protected static ?string $modelLabel = 'question';
    protected static ?string $pluralModelLabel = "Questions d'éligibilité";

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('ordre')
                    ->label('Ordre')
                    ->numeric()
                    ->default(1)
                    ->required(),

                Forms\Components\Textarea::make('question')
                    ->label('Question')
                    ->required()
                    ->rows(3)
                    ->columnSpanFull(),

                Forms\Components\Select::make('type_reponse')
                    ->label('Type de réponse')
                    ->options([
                        'oui_non' => 'Oui / Non',
                        'numerique' => 'Valeur numérique',
                    ])
                    ->default('oui_non')
                    ->required(),

                Forms\Components\Select::make('reponse_bloquante')
                    ->label('Réponse bloquante')
                    ->options([
                        'oui' => 'Oui rend inéligible',
                        'non' => 'Non rend inéligible',
                    ])
                    ->default('oui')
                    ->required(),

                Forms\Components\Textarea::make('message_refus')
                    ->label('Message affiché si inéligible')
                    ->nullable()
                    ->rows(3)
                    ->columnSpanFull(),

                Forms\Components\Toggle::make('actif')
                    ->label('Actif')
                    ->default(true)
                    ->inline(false),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('ordre')
                    ->label('Ordre')
                    ->sortable(),

                Tables\Columns\TextColumn::make('question')
                    ->label('Question')
                    ->limit(80),

                Tables\Columns\BadgeColumn::make('reponse_bloquante')
                    ->label('Réponse bloquante')
                    ->colors([
                        'danger' => 'oui',
                        'warning' => 'non',
                    ])
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'oui' => 'Oui bloque',
                        'non' => 'Non bloque',
                        default => $state,
                    }),

                Tables\Columns\BadgeColumn::make('actif')
                    ->label('Statut')
                    ->colors([
                        'success' => true,
                        'gray' => false,
                    ])
                    ->formatStateUsing(fn (bool $state): string => $state ? 'Active' : 'Inactive'),
            ])
            ->defaultSort('ordre')
            ->filters([
                Tables\Filters\TernaryFilter::make('actif')
                    ->label('Actif'),
            ])
            ->actions([
                Tables\Actions\Action::make('toggle')
                    ->label(fn (QuestionEligibilite $record): string => $record->actif ? 'Désactiver' : 'Activer')
                    ->icon(fn (QuestionEligibilite $record): string => $record->actif ? 'heroicon-o-eye-slash' : 'heroicon-o-eye')
                    ->color(fn (QuestionEligibilite $record): string => $record->actif ? 'warning' : 'success')
                    ->action(fn (QuestionEligibilite $record) => $record->update(['actif' => ! $record->actif])),
                Tables\Actions\EditAction::make()
                    ->label('Modifier'),
            ])
            ->bulkActions([
                //
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListQuestionEligibilites::route('/'),
            'create' => Pages\CreateQuestionEligibilite::route('/create'),
            'edit' => Pages\EditQuestionEligibilite::route('/{record}/edit'),
        ];
    }
}
