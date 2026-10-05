<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Defi extends Model
{
    protected $fillable = [
        'admin_id',
        'titre',
        'description',
        'type',
        'periode',
        'objectif_chiffre',
        'date_fin',
        'points_attribues',
        'statut',
    ];

    protected $casts = [
        'date_fin' => 'date',
    ];

    // 📖 wasChanged('statut') est déjà false si un défi actif est juste resauvegardé
    //    sans toucher au statut : pas de notif en double à chaque édition du BO.
    protected static function booted(): void
    {
        static::saved(function (Defi $defi) {
            if ($defi->wasChanged('statut') && $defi->statut === 'actif') {
                app(\App\Services\NotificationService::class)
                    ->notifierTousLesUsers(new \App\Notifications\NouveauDefiNotification($defi));
            }
        });
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function userDefis()
    {
        return $this->hasMany(UserDefi::class);
    }
}