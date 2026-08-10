<?php

namespace App\Filament\Resources;

use App\Filament\Resources\EvenementResource\Pages;
use App\Models\Evenement;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Auth;

class EvenementResource extends Resource
{
    protected static ?string $model = Evenement::class;
    protected static ?string $navigationIcon = 'heroicon-o-calendar-days';
    protected static ?string $navigationGroup = 'Contenu éditorial';
    protected static ?string $navigationLabel = 'Événements';
    protected static ?string $modelLabel = 'événement';
    protected static ?string $pluralModelLabel = 'Événements';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('titre')
                    ->label('Titre')
                    ->required()
                    ->maxLength(255),

                Forms\Components\Textarea::make('description')
                    ->label('Description')
                    ->rows(4)
                    ->columnSpanFull(),

                Forms\Components\DateTimePicker::make('date_heure')
                    ->label('Date et heure de début')
                    ->required(),

                Forms\Components\DateTimePicker::make('horaire_fin')
                    ->label('Date et heure de fin'),

                Forms\Components\TextInput::make('lieu')
                    ->label('Lieu')
                    ->required()
                    ->maxLength(255),

                Forms\Components\TextInput::make('image_url')
                    ->label('URL de l\'image')
                    ->maxLength(255),

                Forms\Components\Select::make('statut')
                    ->label('Statut')
                    ->options([
                        'brouillon' => 'Brouillon',
                        'publie' => 'Publié',
                        'annule' => 'Annulé',
                        'passe' => 'Passé',
                    ])
                    ->required()
                    ->default('brouillon'),

                Forms\Components\Hidden::make('admin_id')
                    ->default(fn () => Auth::id()),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('titre')
                    ->label('Titre')
                    ->searchable()
                    ->sortable()
                    ->weight('bold')
                    ->limit(50),

                Tables\Columns\TextColumn::make('lieu')
                    ->label('Lieu')
                    ->searchable(),

                Tables\Columns\TextColumn::make('date_heure')
                    ->label('Date et heure')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),

                Tables\Columns\BadgeColumn::make('statut')
                    ->label('Statut')
                    ->colors([
                        'gray' => 'brouillon',
                        'success' => 'publie',
                        'danger' => 'annule',
                        'warning' => 'passe',
                    ])
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'brouillon' => 'Brouillon',
                        'publie' => 'Publié',
                        'annule' => 'Annulé',
                        'passe' => 'Passé',
                        default => $state,
                    }),

                Tables\Columns\TextColumn::make('admin.pseudo')
                    ->label('Créé par')
                    ->default('—'),
            ])
            ->defaultSort('date_heure', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('statut')
                    ->label('Statut')
                    ->options([
                        'brouillon' => 'Brouillon',
                        'publie' => 'Publié',
                        'annule' => 'Annulé',
                        'passe' => 'Passé',
                    ]),
            ])
            ->actions([
                Tables\Actions\Action::make('voir_qr_code')
                    ->label('Voir QR Code')
                    ->icon('heroicon-o-qr-code')
                    ->color('gray')
                    ->modalHeading('QR Code de l\'événement')
                    ->modalContent(fn (Evenement $record) => view('filament.modals.qr-code-token', [
                        'token' => $record->qrCode?->token,
                    ]))
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Fermer'),

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
            'index' => Pages\ListEvenements::route('/'),
            'create' => Pages\CreateEvenement::route('/create'),
            'edit' => Pages\EditEvenement::route('/{record}/edit'),
        ];
    }
}
