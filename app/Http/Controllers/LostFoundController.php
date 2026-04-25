<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\LostFound;
use Illuminate\Support\Facades\Auth;

class LostFoundController extends Controller
{
    public function index()
    {
        return response()->json(LostFound::with('user')->orderBy('created_at', 'desc')->get());
    }

    public function resolve(LostFound $item)
    {
        if (Auth::id() !== $item->user_id && Auth::user()->role !== 'petugas') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $item->update(['status' => 'resolved']);
        return response()->json(['success' => true]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string',
            'type' => 'required|in:lost,found',
            'location' => 'required|string',
            'time_info' => 'required|string',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $data['foto_url'] = $request->file('image')->store('lostfounds', 'public');
        }

        $item = Auth::user()->lostFounds()->create($data);
        return response()->json($item);
    }
}
