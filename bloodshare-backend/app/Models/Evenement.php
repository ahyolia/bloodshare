<?php

namespace App\Models;

use App\Models\Concerns\HasStorageImageUrl;
use Illuminate\Database\Eloquent\Model;

class Evenement extends Model
{
    use HasStorageImageUrl;

    protected $fillable = [
        'admin_id',
        'qr_code_id',
        'titre',
        'description',
        'lieu',
        'date_heure',
        'horaire_fin',
        'statut',
        'image_url',
    ];

    protected $casts = [
        'date_heure'  => 'datetime',
        'horaire_fin' => 'datetime',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function qrCode()
    {
        return $this->belongsTo(QrCode::class);
    }
}