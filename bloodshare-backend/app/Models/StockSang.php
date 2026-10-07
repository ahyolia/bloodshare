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
    //    anonymat en attente). On ne notifie qu'au PASSAGE à "critique" ou qu'à la SORTIE de
    //    "critique" (wasChanged), jamais à une sauvegarde qui laisse le niveau inchangé.
    protected static function booted(): void
    {
        static::saved(function (StockSang $stockSang) {
            if (! $stockSang->wasChanged('niveau')) {
                return;
            }

            if ($stockSang->niveau === 'critique') {
                app(\App\Services\NotificationService::class)
                    ->notifierTousLesUsers(new \App\Notifications\AlertePenurieNotification($stockSang));

                return;
            }

            if ($stockSang->getOriginal('niveau') === 'critique') {
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
