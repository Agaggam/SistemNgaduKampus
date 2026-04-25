<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Report;
use App\Models\Upvote;
use App\Models\Attachment;
use App\Models\BugReport;
use App\Models\Rating;
use App\Models\Timeline;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Report::withCount('votes')->with(['attachments', 'bugReport', 'rating', 'user']);

        if ($request->has('mine')) {
            $query->where('user_id', $user->id);
        }

        $reports = $query->orderBy('created_at', 'desc')->get();
        return response()->json($reports);
    }

    public function stats()
    {
        $total = Report::count();
        if ($total === 0) return response()->json(['sla_percent' => 100, 'avg_rating' => 5.0, 'total' => 0]);

        $onSla = Report::where(function($q) {
            $q->where('status', 'finished')->whereColumn('updated_at', '<=', 'sla_expires_at')
              ->orWhere('status', '!=', 'finished')->where('sla_expires_at', '>', now());
        })->count();

        $slaPercent = round(($onSla / $total) * 100, 1);
        $avgRating = round(\App\Models\Rating::avg('score') ?: 5.0, 1);

        return response()->json([
            'total' => $total,
            'sla_percent' => $slaPercent,
            'avg_rating' => $avgRating,
            'pending_count' => Report::where('status', 'pending')->count(),
            'process_count' => Report::where('status', 'process')->count(),
            'finished_count' => Report::where('status', 'finished')->count(),
        ]);
    }


    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string',
            'location' => 'required|string',
            'description' => 'required|string',
            'mode' => 'nullable|in:reguler,anonim',
            'urgensi' => 'nullable|in:rendah,sedang,tinggi,darurat',
            'is_bug_report' => 'boolean',
            'it_details' => 'nullable',
            'image' => 'nullable|image|max:2048',
        ]);

        return DB::transaction(function () use ($request, $data) {
            // 1. Generate Ticket Code
            $count = Report::count() + 1;
            $kodeTiket = 'RPT-' . date('Ymd') . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);

            // 2. SLA Logic
            $slaHours = 48;
            if ($data['category'] === 'IT' || ($data['is_bug_report'] ?? false)) $slaHours = 24;
            if ($data['category'] === 'Keamanan' || $data['category'] === 'Darurat') $slaHours = 6;

            // 3. Save Core Report
            $report = Auth::user()->reports()->create([
                'title' => $data['title'],
                'category' => $data['category'],
                'location' => $data['location'],
                'description' => $data['description'],
                'mode' => $data['mode'] ?? 'reguler',
                'urgensi' => $data['urgensi'] ?? 'sedang',
                'status' => 'pending',
                'kode_tiket' => $kodeTiket,
                'sla_expires_at' => now()->addHours($slaHours),
            ]);

            // 4. Save Attachment
            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('reports', 'public');
                $report->attachments()->create([
                    'file_url' => $path,
                    'file_type' => $request->file('image')->getClientOriginalExtension()
                ]);
            }

            // 5. Save Bug Report Details
            if ($data['is_bug_report'] ?? false) {
                $it = is_string($data['it_details']) ? json_decode($data['it_details'], true) : $data['it_details'];
                $report->bugReport()->create([
                    'browser' => $it['browser'] ?? null,
                    'device' => $it['device'] ?? null,
                    'error_msg' => 'User Reported Bug',
                    'technical_log' => json_encode($it)
                ]);
            }

            // 6. Initial Timeline
            $report->timelines()->create([
                'user_id' => Auth::id(),
                'status_baru' => 'pending',
                'catatan' => 'Laporan berhasil dibuat oleh pelapor.'
            ]);

            // 7. Create Notification for User
            $report->user->notifications()->create([
                'report_id' => $report->id,
                'title' => 'Laporan Terkirim',
                'message' => "Laporan '{$report->title}' Anda telah terdaftar dengan kode {$kodeTiket}."
            ]);

            return response()->json($report->load('attachments', 'bugReport'));
        });
    }

    public function updateStatus(Request $request, Report $report)
    {
        $data = $request->validate([
            'status' => 'required|in:pending,process,finished',
            'catatan' => 'nullable|string'
        ]);

        return DB::transaction(function () use ($report, $data) {
            $oldStatus = $report->status;
            $report->update(['status' => $data['status']]);

            // Create Timeline Entry
            $report->timelines()->create([
                'user_id' => Auth::id(),
                'status_baru' => $data['status'],
                'catatan' => $data['catatan'] ?? "Status diubah dari $oldStatus ke {$data['status']}"
            ]);

            // Create Notification for Pelapor
            $report->user->notifications()->create([
                'report_id' => $report->id,
                'title' => 'Update Status Laporan',
                'message' => "Status laporan '{$report->title}' Anda kini: " . strtoupper($data['status'])
            ]);

            return response()->json(['success' => true]);
        });
    }

    public function rate(Request $request, Report $report)
    {
        if ($report->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'score' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        $report->rating()->updateOrCreate(
            ['user_id' => Auth::id()],
            ['score' => $data['score'], 'comment' => $data['comment']]
        );

        return response()->json(['success' => true]);
    }

    public function vote(Report $report)
    {
        if (Auth::user()->role !== 'mahasiswa') {
            return response()->json(['message' => 'Mahasiswa only'], 403);
        }

        $userId = Auth::id();
        $vote = Upvote::where('user_id', $userId)->where('report_id', $report->id)->first();

        if ($vote) {
            $vote->delete();
            return response()->json(['voted' => false]);
        } else {
            Upvote::create(['user_id' => $userId, 'report_id' => $report->id]);
            return response()->json(['voted' => true]);
        }
    }

    public function panic(Request $request)
    {
        try {
            $data = $request->validate([
                'lat' => 'nullable',
                'lng' => 'nullable',
                'location_name' => 'nullable|string',
                'jenis_darurat' => 'nullable|string',
            ]);

            $alert = Auth::user()->panicAlerts()->create($data);

            // Notify all Petugas
            $petugasList = \App\Models\User::where('role', 'petugas')->get();
            foreach ($petugasList as $p) {
                try {
                    $p->notifications()->create([
                        'title' => 'DARURAT: Panic Button!',
                        'message' => "Sinyal SOS dari " . Auth::user()->name . " di " . ($data['location_name'] ?? 'Lokasi tidak diketahui'),
                    ]);
                } catch (\Exception $e) {
                    \Log::error("Failed to notify petugas {$p->id}: " . $e->getMessage());
                }
            }

            return response()->json(['success' => true, 'alert' => $alert]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }


    public function latestPanic()
    {
        return response()->json(\App\Models\PanicAlert::with('user')->where('status', 'active')->orderBy('created_at', 'desc')->get());
    }
    public function assigned()
    {
        $user = Auth::user();
        if ($user->role !== 'petugas') {
            return response()->json([]);
        }

        // Get reports where this user is assigned
        $reports = Report::whereHas('assignments', function ($q) use ($user) {
            $q->where('petugas_id', $user->id);
        })->orderBy('updated_at', 'desc')->get();

        return response()->json($reports);
    }


    public function assign(Request $request, Report $report)
    {
        $data = $request->validate([
            'petugas_id' => 'required|exists:users,id',
            'catatan' => 'nullable|string'
        ]);

        return DB::transaction(function () use ($report, $data) {
            // 1. Create Assignment
            $report->assignments()->create([
                'petugas_id' => $data['petugas_id'],
                'catatan' => $data['catatan'],
                'assigned_at' => now(),
                'status' => 'on_progress'
            ]);


            // 2. Update Status to 'process'
            $report->update(['status' => 'process']);

            // 3. Update Timeline
            $report->timelines()->create([
                'user_id' => Auth::id(),
                'status_baru' => 'process',
                'catatan' => 'Laporan telah diteruskan ke petugas lapangan.'
            ]);

            // 4. Notify Petugas
            \App\Models\Notification::create([
                'user_id' => $data['petugas_id'],
                'report_id' => $report->id,
                'title' => 'Tugas Baru Diterima',
                'message' => "Anda ditugaskan untuk menangani laporan: '{$report->title}'"
            ]);

            return response()->json(['success' => true]);
        });
    }

    public function export()
    {
        $reports = Report::with('user')->get();
        
        $callback = function() use ($reports) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['ID', 'Tiket', 'Judul', 'Kategori', 'Status', 'Urgensi', 'Pelapor', 'Tanggal']);

            foreach ($reports as $r) {
                fputcsv($file, [
                    $r->id,
                    $r->kode_tiket,
                    $r->title,
                    $r->category,
                    $r->status,
                    $r->urgensi,
                    $r->user ? $r->user->name : 'N/A',
                    $r->created_at->format('Y-m-d H:i')
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=ngadukampus_rekap_" . date('Ymd_His') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ]);
    }

}
