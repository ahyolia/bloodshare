<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PointsHistorique extends Model
{
    protected $table = 'points_historique';

    protected $fillable = [
        'user_id',
        'points',
        'source',
        'source_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}