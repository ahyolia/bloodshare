<?php

namespace App\Filament\Resources\AdminResource\Pages;

use App\Filament\Resources\AdminResource;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Facades\Hash;

class CreateAdmin extends CreateRecord
{
    protected static string $resource = AdminResource::class;

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('pseudo')
                    ->label('Pseudo')
                    ->required()
                    ->maxLength(255),

                Forms\Components\TextInput::make('email')
                    ->label('Email')
                    ->email()
                    ->required()
                    ->unique()
                    ->maxLength(255),

                Forms\Components\TextInput::make('password')
                    ->label('Mot de passe provisoire')
                    ->password()
                    ->required(),
            ]);
    }

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['password'] = Hash::make($data['password']);
        $data['statut'] = 'actif';

        return $data;
    }

    protected function afterCreate(): void
    {
        $this->record->assignRole('admin');
    }
}
