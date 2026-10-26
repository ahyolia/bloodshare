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
        'generique',
    ];

    protected $casts = [
        'generique' => 'boolean',
    ];

    public function userCartes()
    {
        return $this->hasMany(UserCarte::class);
    }

    // Événements qui remettent cette carte à leurs participants.
    public function evenements()
    {
        return $this->hasMany(Evenement::class);
    }

    /**
     * 📖 Carte Événement remise par un événement qui n'en désigne aucune. Une carte propre
     *    à un événement (forum IUT...) a `generique` à false : elle n'est remise que par
     *    l'événement qui la désigne, jamais à sa place.
     */
    public static function generiqueEvenement(): ?self
    {
        return static::where('categorie', 'evenement')
            ->where('statut', 'active')
            ->where('generique', true)
            ->orderBy('id')
            ->first();
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_cartes')
                    ->withPivot('quantite', 'obtenue_at');
    }
}