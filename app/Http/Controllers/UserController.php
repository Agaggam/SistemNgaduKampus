<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function store(Request $request)
    {
        if (Auth::user()->role !== 'manajemen') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'nim' => 'nullable|string|unique:users',
            'role' => 'required|in:mahasiswa,petugas',
            'password' => 'required|min:6',
        ]);

        $data['password'] = Hash::make($data['password']);
        $user = User::create($data);

        return response()->json(['success' => true, 'user' => $user]);
    }

    public function update(Request $request, User $user)
    {
        if (Auth::user()->role !== 'manajemen') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'nim' => 'nullable|string|unique:users,nim,' . $user->id,
            'role' => 'required|in:mahasiswa,petugas',
            'password' => 'nullable|min:6',
        ]);

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json(['success' => true, 'user' => $user]);
    }

    public function destroy(User $user)
    {
        if (Auth::user()->role !== 'manajemen') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->id === Auth::id()) {
            return response()->json(['message' => 'Cannot delete self'], 400);
        }

        $user->delete();
        return response()->json(['success' => true]);
    }

    public function index()

    {
        if (Auth::user()->role !== 'manajemen') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json(User::whereIn('role', ['mahasiswa', 'petugas'])->get());
    }
}
