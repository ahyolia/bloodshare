<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Banniere extends Model
{
    protected $fillable = [
        'admin_id',
        'titre',
        'message',
        'type',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saved(function (Banniere $banniere) {
            if (($banniere->wasChanged('active') || $banniere->wasRecentlyCreated) && $banniere->active && $banniere->type === 'urgence') {
                app(\App\Services\NotificationService::class)
                    ->notifierTousLesUsers(new \App\Notifications\BanniereUrgenteNotification($banniere));
            }
        });
    }

    // Une bannière est créée par un admin
    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}