<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockSang extends Model
{
    protected $table = 'stock_sang';

    protected $fillable = [
        'admin_id',
        'groupe_sanguin',
        'niveau',
        'maj_at',
    ];

    protected $casts = [
        'maj_at' => 'datetime',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}