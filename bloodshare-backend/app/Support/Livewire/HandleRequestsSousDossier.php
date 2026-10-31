<?php

namespace App\Support\Livewire;

use Livewire\Mechanisms\HandleRequests\HandleRequests;

/**
 * 📖 Livewire écrit l'URL de ses actions (data-update-uri) en chemin relatif à la
 *    racine du domaine, et Laravel retire volontairement le sous-dossier des URLs
 *    relatives. Servi depuis https://sae203.hopto.org/~cameliaa/, le backoffice
 *    postait donc sur /livewire/update, hors du dossier utilisateur : aucune action
 *    Filament (connexion comprise) ne fonctionnait.
 *
 *    On rajoute le sous-dossier de la requête en cours. La route reste
 *    `livewire/update` côté Laravel, qui la reçoit déjà sans le sous-dossier.
 *    Sans sous-dossier (Docker local, Dokploy), getBasePath() est vide : rien ne change.
 *    Branché dans AppServiceProvider::register().
 */
class HandleRequestsSousDossier extends HandleRequests
{
    public function getUpdateUri()
    {
        return request()->getBasePath() . parent::getUpdateUri();
    }
}
