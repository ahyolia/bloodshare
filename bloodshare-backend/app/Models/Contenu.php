<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contenu extends Model
{
    protected $fillable = [
        'admin_id',
        'type',
        'titre',
        'contenu',
        'image_url',
        'categorie',
        'statut',
        'published_at',
        'quiz_cta',
        'le_saviez_vous',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'quiz_cta' => 'boolean',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}