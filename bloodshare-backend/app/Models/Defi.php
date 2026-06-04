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
        'condition_type',
        'objectif_chiffre',
        'points_attribues',
        'statut',
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