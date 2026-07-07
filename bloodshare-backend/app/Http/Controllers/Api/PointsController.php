<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PointsHistorique;
use Illuminate\Http\Request;

class PointsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $historique = PointsHistorique::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($entry) => [
                'points' => $entry->points,
                'source' => $entry->source,
                'created_at' => $entry->created_at,
            ]);

        return response()->json([
            'points_cumules' => $user->points_cumules,
            'historique' => $historique,
        ]);
    }
}
