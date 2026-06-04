<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Carte extends Model
{
    protected $fillable = [
        'titre',
        'description',
        'image_url',
        'rarete',
        'statut',
    ];

    public function userCartes()
    {
        return $this->hasMany(UserCarte::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_cartes')
                    ->withPivot('quantite', 'obtenue_at');
    }
}