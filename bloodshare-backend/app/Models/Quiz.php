<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Quiz extends Model
{
    protected $table = 'quiz';

    protected $fillable = [
        'admin_id',
        'titre',
        'description',
        'categorie',
        'aleatoire',
        'points_attribues',
        'statut',
    ];

    protected $casts = [
        'aleatoire' => 'boolean',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }

    public function userQuiz()
    {
        return $this->hasMany(UserQuiz::class);
    }
}