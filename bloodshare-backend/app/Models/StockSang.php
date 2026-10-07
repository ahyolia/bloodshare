<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockSang extends Model
{
    protected $table = 'stock_sang';

    protected $fillable = [
        'admin_id',
        'groupe_sanguin',
        'niveau',
        'maj_at',
    ];

    protected $casts = [
        'maj_at' => 'datetime',
    ];

    // 📖 Même convention que Defi/Quiz/Evenement (booted() plutôt qu'un Observer séparé) :
    //    alerte générale pour l'instant, pas de ciblage par groupe sanguin déclaré (décision
    //    anonymat en attente). wasRecentlyCreated couvre le cas d'un stock créé directement
    //    en "critique" (wasChanged seul est faux à la création, rien à comparer) — même
    //    garde que Defi/Quiz/Evenement::booted().
    //    Remerciement seulement en sortie vers "correct"/"bon" : un critique → bas reste une
    //    pénurie, "n'est plus en pénurie" serait un mensonge. 📖 Règle provisoire (@nevizsh
    //    27/01) : à valider avec le PO si "bas" doit aussi déclencher un message dédié plutôt
    //    que rien.
    protected static function booted(): void
    {
        static::saved(function (StockSang $stockSang) {
            if (! $stockSang->wasChanged('niveau') && ! $stockSang->wasRecentlyCreated) {
                return;
            }

            if ($stockSang->niveau === 'critique') {
                app(\App\Services\NotificationService::class)
                    ->notifierTousLesUsers(new \App\Notifications\AlertePenurieNotification($stockSang));

                return;
            }

            if (
                in_array($stockSang->niveau, ['correct', 'bon'], true)
                && $stockSang->getOriginal('niveau') === 'critique'
            ) {
                app(\App\Services\NotificationService::class)
                    ->notifierTousLesUsers(new \App\Notifications\RemerciementPenurieNotification($stockSang));
            }
        });
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}
