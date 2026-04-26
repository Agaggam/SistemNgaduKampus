<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

// Taruh di routes/web.php atau buat file baru
Route::get('/migrasi-aman-bos', function () {
    try {
        Artisan::call('migrate', ['--force' => true]);
        return "Database berhasil dimigrasi! <br><pre>" . Artisan::output() . "</pre>";
    } catch (\Exception $e) {
        return "Gagal migrasi: " . $e->getMessage();
    }
});

Route::get('/link-storage-bos', function () {
    $target = storage_path('app/public');
    $link = public_path('storage');
    if (file_exists($link)) {
        return "Link storage sudah ada.";
    }
    try {
        symlink($target, $link);
        return "Link storage berhasil dibuat!";
    } catch (\Exception $e) {
        return "Gagal buat link: " . $e->getMessage() . "<br>Target: $target <br>Link: $link";
    }
});

Route::get('/fix-storage-bos', function() {
    try {
        Artisan::call('cache:clear');
        Artisan::call('view:clear');
        Artisan::call('config:clear');
        
        // Try to create storage folders if missing
        $paths = [
            storage_path('framework/sessions'),
            storage_path('framework/views'),
            storage_path('framework/cache'),
            storage_path('app/public/reports'),
            storage_path('app/public/lostfounds'),
        ];
        
        foreach($paths as $p) {
            if(!file_exists($p)) mkdir($p, 0777, true);
        }
        
        return "Cache dibersihkan & Folder storage disiapkan!";
    } catch(\Exception $e) {
        return "Gagal fix storage: " . $e->getMessage();
    }
});
