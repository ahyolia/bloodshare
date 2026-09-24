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

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function userDefis()
    {
        return $this->hasMany(UserDefi::class);
    }
}