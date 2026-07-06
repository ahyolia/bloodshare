<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Parrainage extends Model
{
    protected $fillable = [
        'parrain_id',
        'filleul_id',
        'statut',
        'valide_at',
    ];

    protected $casts = [
        'valide_at' => 'datetime',
    ];

    public function parrain()
    {
        return $this->belongsTo(User::class, 'parrain_id');
    }

    public function filleul()
    {
        return $this->belongsTo(User::class, 'filleul_id');
    }
}