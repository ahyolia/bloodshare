<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserQuiz extends Model
{
    protected $table = 'user_quiz';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'quiz_id',
        'score',
        'complete',
        'points_attribues',
        'nb_tentatives',
        'completed_at',
        'progression',
        'commence_at',
        'rappel_envoye',
    ];

    protected $casts = [
        'complete'         => 'boolean',
        'points_attribues' => 'boolean',
        'completed_at'     => 'datetime',
        'progression'      => 'array',
        'commence_at'      => 'datetime',
        'rappel_envoye'    => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function quiz()
    {
        return $this->belongsTo(Quiz::class);
    }
}