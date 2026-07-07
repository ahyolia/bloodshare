<?php

namespace App\Filament\Resources;

use App\Filament\Resources\FaqResource\Pages;
use App\Models\Faq;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Auth;

class FaqResource extends Resource
{
    protected static ?string $model = Faq::class;
    protected static ?string $navigationIcon = 'heroicon-o-question-mark-circle';
    protected static ?string $navigationGroup = 'Contenu éditorial';
    protected static ?string $navigationLabel = 'FAQ';
    protected static ?string $modelLabel = 'question FAQ';
    protected static ?string $pluralModelLabel = 'FAQ';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('categorie')
                    ->label('Catégorie')
                    ->options([
                        'eligibilite' => 'Éligibilité',
                        'processus_don' => 'Processus du don',
                        'apres_don' => 'Après le don',
                        'application' => 'Application',
                    ])
                    ->required(),

                Forms\Components\TextInput::make('question')
                    ->label('Question')
                    ->required()
                    ->maxLength(255)
                    ->columnSpanFull(),

                Forms\Components\Textarea::make('reponse')
                    ->label('Réponse')
                    ->required()
                    ->rows(4)
                    ->columnSpanFull(),

                Forms\Components\TextInput::make('ordre')
                    ->label('Ordre')
                    ->numeric()
                    ->default(1)
                    ->required(),

                Forms\Components\Toggle::make('actif')
                    ->label('Actif')
                    ->default(true)
                    ->inline(false),

                Forms\Components\Hidden::make('admin_id')
                    ->default(fn () => Auth::id()),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('categorie')
                    ->label('Catégorie')
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'eligibilite' => 'Éligibilité',
                        'processus_don' => 'Processus du don',
                        'apres_don' => 'Après le don',
                        'application' => 'Application',
                        default => $state,
                    })
                    ->searchable(),

                Tables\Columns\TextColumn::make('question')
                    ->label('Question')
                    ->limit(60),

                Tables\Columns\TextColumn::make('ordre')
                    ->label('Ordre')
                    ->sortable(),

                Tables\Columns\IconColumn::make('actif')
                    ->label('Actif')
                    ->boolean(),

                Tables\Columns\TextColumn::make('admin.pseudo')
                    ->label('Créée par')
                    ->default('—'),
            ])
            ->defaultSort('ordre')
            ->filters([
                Tables\Filters\SelectFilter::make('categorie')
                    ->label('Catégorie')
                    ->options([
                        'eligibilite' => 'Éligibilité',
                        'processus_don' => 'Processus du don',
                        'apres_don' => 'Après le don',
                        'application' => 'Application',
                    ]),
                Tables\Filters\TernaryFilter::make('actif')
                    ->label('Actif'),
            ])
            ->actions([
                Tables\Actions\Action::make('toggle')
                    ->label(fn (Faq $record): string => $record->actif ? 'Désactiver' : 'Activer')
                    ->icon(fn (Faq $record): string => $record->actif ? 'heroicon-o-eye-slash' : 'heroicon-o-eye')
                    ->color(fn (Faq $record): string => $record->actif ? 'warning' : 'success')
                    ->action(fn (Faq $record) => $record->update(['actif' => ! $record->actif])),
                Tables\Actions\EditAction::make()
                    ->label('Modifier'),
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
            'index' => Pages\ListFaqs::route('/'),
            'create' => Pages\CreateFaq::route('/create'),
            'edit' => Pages\EditFaq::route('/{record}/edit'),
        ];
    }
}
