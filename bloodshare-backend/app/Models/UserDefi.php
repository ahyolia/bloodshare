<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserDefi extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'defi_id',
        'progression',
        'complete',
        'completed_at',
    ];

    protected $casts = [
        'complete'     => 'boolean',
        'completed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function defi()
    {
        return $this->belongsTo(Defi::class);
    }
}