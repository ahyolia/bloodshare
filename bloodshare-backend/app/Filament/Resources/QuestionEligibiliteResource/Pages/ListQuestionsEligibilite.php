<?php

namespace App\Filament\Resources\QuestionEligibiliteResource\Pages;

use App\Filament\Resources\QuestionEligibiliteResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListQuestionsEligibilite extends ListRecords
{
    protected static string $resource = QuestionEligibiliteResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }

    public function getSubheading(): ?string
    {
        return "Ce sont des critères médicaux officiels du CHT. Seul le statut actif/inactif "
            . "est modifiable par un admin standard — la modification du texte d'une question "
            . 'est réservée au super_admin pour éviter toute erreur non maîtrisée.';
    }
}
