<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ContenuResource\Pages;
use App\Models\Contenu;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Auth;

class ContenuResource extends Resource
{
    protected static ?string $model = Contenu::class;
    protected static ?string $navigationIcon = 'heroicon-o-document-text';
    protected static ?string $navigationGroup = 'Contenu éditorial';
    protected static ?string $navigationLabel = 'Contenus';
    protected static ?string $modelLabel = 'contenu';
    protected static ?string $pluralModelLabel = 'Contenus';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('type')
                    ->label('Type')
                    ->options([
                        'fiche_info' => 'Fiche info & don',
                        'actualite' => 'Actualité',
                    ])
                    ->required()
                    ->live(),

                Forms\Components\TextInput::make('titre')
                    ->label('Titre')
                    ->required()
                    ->maxLength(255),

                Forms\Components\TextInput::make('categorie')
                    ->label('Catégorie')
                    ->maxLength(255)
                    ->visible(fn ($get) => $get('type') === 'fiche_info'),

                Forms\Components\Textarea::make('contenu')
                    ->label('Contenu')
                    ->required()
                    ->rows(6)
                    ->columnSpanFull(),

                Forms\Components\TextInput::make('image_url')
                    ->label('URL de l\'image')
                    ->maxLength(255),

                Forms\Components\Select::make('statut')
                    ->label('Statut')
                    ->options([
                        'brouillon' => 'Brouillon',
                        'publie' => 'Publié',
                    ])
                    ->required()
                    ->default('brouillon'),

                Forms\Components\DateTimePicker::make('published_at')
                    ->label('Date de publication'),

                Forms\Components\Hidden::make('admin_id')
                    ->default(fn () => Auth::id()),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\BadgeColumn::make('type')
                    ->label('Type')
                    ->colors([
                        'info' => 'fiche_info',
                        'success' => 'actualite',
                    ])
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'fiche_info' => 'Fiche info & don',
                        'actualite' => 'Actualité',
                        default => $state,
                    }),

                Tables\Columns\TextColumn::make('titre')
                    ->label('Titre')
                    ->searchable()
                    ->sortable()
                    ->weight('bold')
                    ->limit(50),

                Tables\Columns\TextColumn::make('categorie')
                    ->label('Catégorie')
                    ->default('—'),

                Tables\Columns\BadgeColumn::make('statut')
                    ->label('Statut')
                    ->colors([
                        'gray' => 'brouillon',
                        'success' => 'publie',
                    ])
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'brouillon' => 'Brouillon',
                        'publie' => 'Publié',
                        default => $state,
                    }),

                Tables\Columns\TextColumn::make('published_at')
                    ->label('Publié le')
                    ->date('d/m/Y')
                    ->sortable(),

                Tables\Columns\TextColumn::make('admin.pseudo')
                    ->label('Créé par')
                    ->default('—'),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('type')
                    ->label('Type')
                    ->options([
                        'fiche_info' => 'Fiche info & don',
                        'actualite' => 'Actualité',
                    ]),

                Tables\Filters\SelectFilter::make('statut')
                    ->label('Statut')
                    ->options([
                        'brouillon' => 'Brouillon',
                        'publie' => 'Publié',
                    ]),
            ])
            ->actions([
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
            'index' => Pages\ListContenus::route('/'),
            'create' => Pages\CreateContenu::route('/create'),
            'edit' => Pages\EditContenu::route('/{record}/edit'),
        ];
    }
}
