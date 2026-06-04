<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booster extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'scan_id',
        'source',
        'statut',
        'obtenu_at',
        'ouvert_at',
    ];

    protected $casts = [
        'obtenu_at' => 'datetime',
        'ouvert_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scan()
    {
        return $this->belongsTo(QrCodeScan::class, 'scan_id');
    }

    public function cartes()
    {
        return $this->hasMany(UserCarte::class);
    }
}