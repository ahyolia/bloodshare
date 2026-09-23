<?php

namespace App\Models;

use App\Models\Concerns\HasStorageImageUrl;
use Illuminate\Database\Eloquent\Model;

class Carte extends Model
{
    use HasStorageImageUrl;

    protected $fillable = [
        'titre',
        'description',
        'image_url',
        'categorie',
        'mois_numero',
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