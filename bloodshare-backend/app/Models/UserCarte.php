<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserCarte extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'carte_id',
        'quantite',
        'obtenue_at',
    ];

    protected $casts = [
        'obtenue_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function carte()
    {
        return $this->belongsTo(Carte::class);
    }
}