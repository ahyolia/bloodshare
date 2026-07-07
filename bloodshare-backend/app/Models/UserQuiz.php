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
    ];

    protected $casts = [
        'complete'         => 'boolean',
        'points_attribues' => 'boolean',
        'completed_at'     => 'datetime',
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