<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QrCode extends Model
{
    protected $table = 'qr_codes';

    protected $fillable = [
        'type',
        'token',
        'evenement_id',
        'actif',
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];

    public function evenement()
    {
        return $this->belongsTo(Evenement::class);
    }

    public function scans()
    {
        return $this->hasMany(QrCodeScan::class);
    }
}