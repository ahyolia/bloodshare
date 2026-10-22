<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class QrCode extends Model
{
    use HasUuids;

    protected $table = 'qr_codes';

    protected $fillable = [
        'type',
        'token',
        'evenement_id',
        'actif',
        'secours_jusqu_a',
    ];

    protected $casts = [
        'actif' => 'boolean',
        'secours_jusqu_a' => 'datetime',
    ];

    public function secoursActif(): bool
    {
        return (bool) $this->secours_jusqu_a?->isFuture();
    }

    public function evenement()
    {
        return $this->belongsTo(Evenement::class);
    }

    public function scans()
    {
        return $this->hasMany(QrCodeScan::class);
    }
}