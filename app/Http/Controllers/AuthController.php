<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function showLogin()
    {
        if (Auth::check()) return redirect()->route('dashboard');
        return view('auth.login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'nim' => ['required_without:email'],
            'email' => ['required_without:nim'],
            'password' => ['required'],
        ]);

        // Attempt login with NIM or Email
        $loginField = $request->has('nim') ? 'nim' : 'email';
        
        if (Auth::attempt([$loginField => $request->$loginField, 'password' => $request->password])) {
            $request->session()->regenerate();
            return response()->json(['success' => true]);
        }

        return response()->json(['success' => false, 'message' => 'NIM/Email atau Password salah.'], 401);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }
}
