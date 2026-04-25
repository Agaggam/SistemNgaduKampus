<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Report;
use App\Models\Rating;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $role = Auth::user()->role;
        
        // Ensure the view exists, fallback to mahasiswa if not
        $view = "dashboards.$role";
        if (!view()->exists($view)) {
            return view('dashboards.mahasiswa');
        }

        return view($view);
    }


    public function stats()
    {
        $user = Auth::user();
        $total = Report::count();
        $avgRating = round(Rating::avg('score') ?: 5.0, 1);

        // Calculate SLA fulfillment %
        // Simple logic: If finished, was it on time? If pending/process, is it still within SLA?
        $onSla = Report::where(function($q) {
            $q->where('status', 'finished')->whereColumn('updated_at', '<=', 'sla_expires_at')
              ->orWhere('status', '!=', 'finished')->where('sla_expires_at', '>', now());
        })->count();

        $slaPercent = $total > 0 ? round(($onSla / $total) * 100, 0) : 100;

        if ($user->role === 'mahasiswa') {
            return response()->json([
                'total' => Report::where('user_id', $user->id)->count(),
                'proses' => Report::where('user_id', $user->id)->where('status', 'process')->count(),
                'selesai' => Report::where('user_id', $user->id)->where('status', 'finished')->count(),
                'rating' => $avgRating,
                'sla_percent' => $slaPercent
            ]);
        } else {
            return response()->json([
                'total' => $total,
                'pending' => Report::where('status', 'pending')->count(),
                'proses' => Report::where('status', 'process')->count(),
                'selesai' => Report::where('status', 'finished')->count(),
                'rating' => $avgRating,
                'sla_percent' => $slaPercent
            ]);
        }
    }

}
