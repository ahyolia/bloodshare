<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BanniereResource\Pages;
use App\Models\Banniere;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Auth;

class BanniereResource extends Resource
{
    protected static ?string $model = Banniere::class;
    protected static ?string $navigationIcon = 'heroicon-o-megaphone';
    protected static ?string $navigationGroup = 'Communication';
    protected static ?string $navigationLabel = 'Bannières';
    protected static ?string $modelLabel = 'bannière';
    protected static ?string $pluralModelLabel = 'Bannières';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('titre')
                    ->label('Titre')
                    ->required()
                    ->maxLength(255),

                Forms\Components\Select::make('type')
                    ->label('Type')
                    ->options([
                        'penurie' => 'Pénurie',
                        'urgence' => 'Urgence',
                        'info' => 'Information',
                        'evenement' => 'Événement',
                    ])
                    ->required()
                    ->default('info'),

                Forms\Components\Textarea::make('message')
                    ->label('Message')
                    ->required()
                    ->rows(4)
                    ->columnSpanFull(),

                Forms\Components\Toggle::make('active')
                    ->label('Active')
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
                Tables\Columns\TextColumn::make('titre')
                    ->label('Titre')
                    ->searchable()
                    ->sortable()
                    ->weight('bold')
                    ->limit(50),

                Tables\Columns\BadgeColumn::make('type')
                    ->label('Type')
                    ->colors([
                        'danger' => 'penurie',
                        'warning' => 'urgence',
                        'info' => 'info',
                        'success' => 'evenement',
                    ])
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'penurie' => 'Pénurie',
                        'urgence' => 'Urgence',
                        'info' => 'Information',
                        'evenement' => 'Événement',
                        default => $state,
                    }),

                Tables\Columns\IconColumn::make('active')
                    ->label('Active')
                    ->boolean()
                    ->sortable(),

                Tables\Columns\TextColumn::make('admin.pseudo')
                    ->label('Créée par')
                    ->default('—'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Créée le')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('type')
                    ->label('Type')
                    ->options([
                        'penurie' => 'Pénurie',
                        'urgence' => 'Urgence',
                        'info' => 'Information',
                        'evenement' => 'Événement',
                    ]),
                Tables\Filters\TernaryFilter::make('active')
                    ->label('Active'),
            ])
            ->actions([
                Tables\Actions\Action::make('toggle')
                    ->label(fn (Banniere $record): string => $record->active ? 'Désactiver' : 'Activer')
                    ->icon(fn (Banniere $record): string => $record->active ? 'heroicon-o-eye-slash' : 'heroicon-o-eye')
                    ->color(fn (Banniere $record): string => $record->active ? 'warning' : 'success')
                    ->action(fn (Banniere $record) => $record->update(['active' => ! $record->active])),
                Tables\Actions\EditAction::make()->label('Modifier'),
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
            'index' => Pages\ListBannieres::route('/'),
            'create' => Pages\CreateBanniere::route('/create'),
            'edit' => Pages\EditBanniere::route('/{record}/edit'),
        ];
    }
}
