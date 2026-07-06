<?php

namespace App\Filament\Resources;

use App\Filament\Resources\StockSangResource\Pages;
use App\Models\StockSang;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Auth;

class StockSangResource extends Resource
{
    protected static ?string $model = StockSang::class;
    protected static ?string $navigationIcon = 'heroicon-o-rectangle-stack';
    protected static ?string $navigationGroup = 'Opérations';
    protected static ?string $navigationLabel = 'Stocks de sang';
    protected static ?string $modelLabel = 'stock de sang';
    protected static ?string $pluralModelLabel = 'Stocks de sang';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('groupe_sanguin')
                    ->label('Groupe sanguin')
                    ->options([
                        'O-' => 'O-',
                        'O+' => 'O+',
                        'A-' => 'A-',
                        'A+' => 'A+',
                        'B-' => 'B-',
                        'B+' => 'B+',
                        'AB-' => 'AB-',
                        'AB+' => 'AB+',
                    ])
                    ->required(),

                Forms\Components\Select::make('niveau')
                    ->label('Niveau actuel')
                    ->options([
                        'critique' => '🔴 Critique',
                        'bas' => '🟠 Bas',
                        'correct' => '🟡 Correct',
                        'bon' => '🟢 Bon',
                    ])
                    ->required()
                    ->default('correct'),

                Forms\Components\Hidden::make('admin_id')
                    ->default(fn () => Auth::id()),

                Forms\Components\Hidden::make('maj_at')
                    ->default(now()),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('groupe_sanguin')
                    ->label('Groupe sanguin')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),

                Tables\Columns\BadgeColumn::make('niveau')
                    ->label('Niveau')
                    ->colors([
                        'danger' => 'critique',
                        'warning' => 'bas',
                        'info' => 'correct',
                        'success' => 'bon',
                    ])
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'critique' => '🔴 Critique',
                        'bas' => '🟠 Bas',
                        'correct' => '🟡 Correct',
                        'bon' => '🟢 Bon',
                        default => $state,
                    }),

                Tables\Columns\TextColumn::make('admin.pseudo')
                    ->label('Mis à jour par')
                    ->default('—'),

                Tables\Columns\TextColumn::make('maj_at')
                    ->label('Dernière mise à jour')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('groupe_sanguin')
            ->filters([
                Tables\Filters\SelectFilter::make('niveau')
                    ->label('Niveau')
                    ->options([
                        'critique' => 'Critique',
                        'bas' => 'Bas',
                        'correct' => 'Correct',
                        'bon' => 'Bon',
                    ]),
            ])
            ->actions([
                Tables\Actions\EditAction::make()
                    ->label('Mettre à jour'),
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
            'index' => Pages\ListStockSangs::route('/'),
            'create' => Pages\CreateStockSang::route('/create'),
            'edit' => Pages\EditStockSang::route('/{record}/edit'),
        ];
    }
}