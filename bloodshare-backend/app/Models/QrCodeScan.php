<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QrCodeScan extends Model
{
    public $timestamps = false;

    protected $table = 'qr_code_scans';

    protected $fillable = [
        'user_id',
        'qr_code_id',
        'points_attribues',
        'booster_attribue',
        'scanned_at',
    ];

    protected $casts = [
        'booster_attribue' => 'boolean',
        'scanned_at'       => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function qrCode()
    {
        return $this->belongsTo(QrCode::class);
    }

    public function don()
    {
        return $this->hasOne(Don::class, 'scan_id');
    }
}