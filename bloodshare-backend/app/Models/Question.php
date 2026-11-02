<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    protected $fillable = [
        'quiz_id',
        'intitule',
        'type',
        'ordre',
        'aleatoire',
        'explication',
        'contenu_id',
    ];

    protected $casts = [
        'aleatoire' => 'boolean',
    ];

    public function quiz()
    {
        return $this->belongsTo(Quiz::class);
    }

    public function reponses()
    {
        return $this->hasMany(Reponse::class);
    }

    // 📖 Fiche pratique liée (contenu de type fiche_info), facultative.
    public function contenu()
    {
        return $this->belongsTo(Contenu::class);
    }
}