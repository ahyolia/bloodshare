<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Badge extends Model
{
    protected $fillable = [
        'nom',
        'image_url',
        'condition_type',
        'condition_valeur',
        'action_specifique',
        'statut',
    ];

    // Un badge est obtenu par plusieurs users
    public function users()
    {
        return $this->hasMany(UserBadge::class);
    }
}