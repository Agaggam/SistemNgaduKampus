<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\LostFoundController;
use Illuminate\Support\Facades\Route;

Route::get('/', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // API-like routes for interactivity
    Route::get('/api/reports', [ReportController::class, 'index']);
    Route::get('/api/reports/assigned', [ReportController::class, 'assigned']);
    Route::get('/api/reports/export', [ReportController::class, 'export']);
    Route::post('/api/reports', [ReportController::class, 'store']);
    Route::post('/api/reports/{report}/vote', [ReportController::class, 'vote']);
    Route::post('/api/reports/{report}/status', [ReportController::class, 'updateStatus']);
    Route::post('/api/reports/{report}/rate', [ReportController::class, 'rate']);
    Route::post('/api/panic', [ReportController::class, 'panic']);
    Route::post('/api/reports/{report}/assign', [ReportController::class, 'assign']);
    Route::get('/api/panic/latest', [ReportController::class, 'latestPanic']);
    Route::get('/api/lost-founds', [LostFoundController::class, 'index']);
    Route::post('/api/lost-founds', [LostFoundController::class, 'store']);
    Route::post('/api/lost-founds/{item}/resolve', [LostFoundController::class, 'resolve']);
    Route::get('/api/stats', [DashboardController::class, 'stats']);
    
    Route::get('/api/notifications', [\App\Http\Controllers\NotificationController::class, 'index']);
    Route::post('/api/notifications/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
    
    // User Management for Management Role
    Route::get('/api/users', [\App\Http\Controllers\UserController::class, 'index']);
    Route::post('/api/users', [\App\Http\Controllers\UserController::class, 'store']);
    Route::put('/api/users/{user}', [\App\Http\Controllers\UserController::class, 'update']);
    Route::delete('/api/users/{user}', [\App\Http\Controllers\UserController::class, 'destroy']);
});

// Migration Helper for InfinityFree
require __DIR__ . '/migration_helper.php';
