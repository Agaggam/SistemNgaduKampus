<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notification;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index()
    {
        $notifications = Auth::user()->notifications()
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();
            
        $unreadCount = Auth::user()->notifications()->where('is_read', false)->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount
        ]);
    }

    public function markAsRead()
    {
        Auth::user()->notifications()->where('is_read', false)->update(['is_read' => true]);
        return response()->json(['success' => true]);
    }
}
