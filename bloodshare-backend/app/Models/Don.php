<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Don extends Model
{
    protected $fillable = [
        'user_id',
        'scan_id',
        'date_don',
        'statut',
    ];

    protected $casts = [
        'date_don' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scan()
    {
        return $this->belongsTo(QrCodeScan::class, 'scan_id');
    }
}