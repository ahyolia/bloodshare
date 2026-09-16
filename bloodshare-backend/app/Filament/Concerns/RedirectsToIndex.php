<?php

namespace App\Filament\Concerns;

// 📖 Filament redirige par défaut vers la fiche d'édition après une création,
// et reste sur la fiche après une modification. Ce trait uniformise le
// comportement demandé pour tout le backoffice : toujours revenir sur la
// liste après Create/Save.
trait RedirectsToIndex
{
    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
