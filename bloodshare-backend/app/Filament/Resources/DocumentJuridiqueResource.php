<?php

namespace App\Filament\Resources;

use App\Filament\Resources\DocumentJuridiqueResource\Pages;
use App\Models\DocumentJuridique;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Auth;

class DocumentJuridiqueResource extends Resource
{
    protected static ?string $model = DocumentJuridique::class;
    protected static ?string $navigationIcon = 'heroicon-o-scale';
    protected static ?string $navigationGroup = 'Administration';
    protected static ?string $navigationLabel = 'Documents juridiques';
    protected static ?string $modelLabel = 'document juridique';
    protected static ?string $pluralModelLabel = 'Documents juridiques';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('titre')
                    ->label('Titre')
                    ->required()
                    ->maxLength(255),

                Forms\Components\TextInput::make('version')
                    ->label('Version')
                    ->required()
                    ->maxLength(20)
                    ->helperText('À augmenter (ex. 1.0 → 1.1) à chaque modification importante.'),

                // 📖 Même syntaxe simple que celle lue par l'app (components/DocumentTexte) :
                //    pas d'éditeur riche, pour ne pas ajouter de dépendance de rendu HTML
                //    côté mobile.
                Forms\Components\Textarea::make('contenu')
                    ->label('Contenu')
                    ->maxLength(50000)
                    ->rows(25)
                    ->helperText('Mise en forme : « ## Titre » pour un titre de section, « - » en début de ligne pour une puce, une ligne vide entre deux paragraphes. Tant que le contenu est vide, l\'app affiche « bientôt disponible ».')
                    ->columnSpanFull(),

                Forms\Components\Hidden::make('admin_id')
                    ->default(fn () => Auth::id())
                    ->dehydrateStateUsing(fn () => Auth::id()),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('titre')
                    ->label('Document'),

                Tables\Columns\TextColumn::make('version')
                    ->label('Version'),

                Tables\Columns\TextColumn::make('contenu')
                    ->label('État')
                    ->badge()
                    ->getStateUsing(fn (DocumentJuridique $record): string => blank($record->contenu) ? 'À rédiger' : 'Publié')
                    ->color(fn (string $state): string => $state === 'Publié' ? 'success' : 'warning'),

                Tables\Columns\TextColumn::make('updated_at')
                    ->label('Dernière modification')
                    ->dateTime('d/m/Y H:i'),
            ])
            ->actions([
                Tables\Actions\ViewAction::make()
                    ->label('Lire'),
                Tables\Actions\EditAction::make()
                    ->label('Modifier')
                    ->visible(fn () => auth()->user()->hasRole('super_admin')),
            ])
            ->paginated(false);
    }

    // 📖 Les trois documents sont créés par la migration : on ne peut ni en ajouter ni
    //    en supprimer, seulement les modifier.
    public static function canCreate(): bool
    {
        return false;
    }

    public static function canDelete($record): bool
    {
        return false;
    }

    // 📖 Texte engageant juridiquement l'association : modification réservée au
    //    super_admin, un admin peut seulement le lire. Filet de sécurité en plus du
    //    bouton masqué, contre l'accès direct à l'URL d'édition.
    public static function canEdit($record): bool
    {
        return auth()->user()->hasRole('super_admin');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListDocumentsJuridiques::route('/'),
            'edit' => Pages\EditDocumentJuridique::route('/{record}/edit'),
        ];
    }
}
