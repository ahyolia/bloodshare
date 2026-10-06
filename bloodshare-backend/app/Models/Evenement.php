<?php

namespace App\Models;

use App\Models\Concerns\HasStorageImageUrl;
use Illuminate\Database\Eloquent\Model;

class Evenement extends Model
{
    use HasStorageImageUrl;

    protected $fillable = [
        'admin_id',
        'qr_code_id',
        'titre',
        'description',
        'lieu',
        'date_heure',
        'horaire_fin',
        'statut',
        'image_url',
    ];

    protected $casts = [
        'date_heure'  => 'datetime',
        'horaire_fin' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::saved(function (Evenement $evenement) {
            if (($evenement->wasChanged('statut') || $evenement->wasRecentlyCreated) && $evenement->statut === 'publie') {
                app(\App\Services\NotificationService::class)
                    ->notifierTousLesUsers(new \App\Notifications\NouvelEvenementNotification($evenement));
            }
        });
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function qrCode()
    {
        return $this->belongsTo(QrCode::class);
    }
}