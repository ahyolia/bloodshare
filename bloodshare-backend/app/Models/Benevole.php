<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Benevole extends Model
{
    protected $fillable = [
        'user_id',
        'motivation',
        'statut',
        'valide_at',
    ];

    protected $casts = [
        'valide_at' => 'datetime',
    ];

    // Un bénévole est un utilisateur
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}