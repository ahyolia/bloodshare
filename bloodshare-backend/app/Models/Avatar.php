<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Avatar extends Model
{
    protected $fillable = [
        'nom',
        'image_url',
        'actif',
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];

    // Un avatar appartient à plusieurs users
    public function users()
    {
        return $this->hasMany(User::class);
    }
}