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
    protected static ?string $navigationLabel = 'Éligibilité au don';
    protected static ?string $modelLabel = 'question d\'éligibilité';
    protected static ?string $pluralModelLabel = 'Éligibilité au don';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('ordre')
                    ->label('Ordre')
                    ->numeric()
                    ->default(1)
                    ->required(),

                Forms\Components\TextInput::make('question')
                    ->label('Question')
                    ->required()
                    ->maxLength(255)
                    ->columnSpanFull(),

                Forms\Components\Select::make('type_reponse')
                    ->label('Type de réponse')
                    ->options([
                        'oui_non' => 'Oui / Non',
                    ])
                    ->default('oui_non')
                    ->required(),

                // 📖 La valeur de réponse qui rend le donneur inéligible pour cette
                //    question (ex : répondre "Non" à l'âge, ou "Oui" à la grossesse).
                Forms\Components\Select::make('reponse_bloquante')
                    ->label('Réponse bloquante')
                    ->options([
                        'oui' => 'Oui',
                        'non' => 'Non',
                    ])
                    ->required(),

                Forms\Components\Textarea::make('message_refus')
                    ->label('Message affiché si bloquant')
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
                    ->limit(70),

                Tables\Columns\TextColumn::make('reponse_bloquante')
                    ->label('Réponse bloquante')
                    ->formatStateUsing(fn (string $state): string => ucfirst($state)),

                Tables\Columns\IconColumn::make('actif')
                    ->label('Actif')
                    ->boolean(),
            ])
            ->defaultSort('ordre')
            ->filters([
                Tables\Filters\TernaryFilter::make('actif')
                    ->label('Actif'),
            ])
            // 📖 Modifier le texte d'un critère médical reste réservé au super_admin :
            //    un admin standard ne peut ajuster que le statut actif/inactif.
            ->actions([
                Tables\Actions\Action::make('toggle')
                    ->label(fn (QuestionEligibilite $record): string => $record->actif ? 'Désactiver' : 'Activer')
                    ->icon(fn (QuestionEligibilite $record): string => $record->actif ? 'heroicon-o-eye-slash' : 'heroicon-o-eye')
                    ->color(fn (QuestionEligibilite $record): string => $record->actif ? 'warning' : 'success')
                    ->action(fn (QuestionEligibilite $record) => $record->update(['actif' => ! $record->actif])),
                Tables\Actions\EditAction::make()
                    ->label('Modifier')
                    ->visible(fn () => auth()->user()->hasRole('super_admin')),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    // 📖 Filet de sécurité en plus du bouton masqué : empêche aussi l'accès direct
    //    à l'URL d'édition pour un admin non super_admin.
    public static function canEdit($record): bool
    {
        return auth()->user()->hasRole('super_admin');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListQuestionsEligibilite::route('/'),
            'create' => Pages\CreateQuestionEligibilite::route('/create'),
            'edit' => Pages\EditQuestionEligibilite::route('/{record}/edit'),
        ];
    }
}
