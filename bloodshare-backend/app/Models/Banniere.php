<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Banniere extends Model
{
    protected $fillable = [
        'admin_id',
        'titre',
        'message',
        'type',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    // Une bannière est créée par un admin
    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}