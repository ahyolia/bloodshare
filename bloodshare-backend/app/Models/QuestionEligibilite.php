<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuestionEligibilite extends Model
{
    protected $table = 'questions_eligibilite';

    protected $fillable = [
        'ordre',
        'question',
        'type_reponse',
        'reponse_bloquante',
        'message_refus',
        'actif',
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];
}
