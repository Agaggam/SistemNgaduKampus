<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Report;
use App\Models\LostFound;
use App\Models\Notification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Users
        $mhs = User::updateOrCreate(
            ['email' => 'mhs@umm.ac.id'],
            [
                'name' => 'Fadil Mahasiswa',
                'nim' => '202110370311001',
                'role' => 'mahasiswa',
                'password' => Hash::make('password'),
            ]
        );

        $petugas = User::updateOrCreate(
            ['email' => 'petugas@umm.ac.id'],
            [
                'name' => 'Bpk. Supri (Security)',
                'role' => 'petugas',
                'password' => Hash::make('password'),
            ]
        );

        $admin = User::updateOrCreate(
            ['email' => 'admin@umm.ac.id'],
            [
                'name' => 'Admin Manajemen',
                'role' => 'manajemen',
                'password' => Hash::make('password'),
            ]
        );

        // 2. Reports
        $reports = [
            [
                'title' => 'AC Ruang GKB 1 Bocor',
                'category' => 'Fasilitas',
                'location' => 'GKB 1 Lantai 3',
                'description' => 'Air AC menetes ke proyektor di ruang 104, mohon segera diperbaiki.',
                'status' => 'process',
                'urgensi' => 'tinggi',
                'kode_tiket' => 'RPT-20260425-0001'
            ],
            [
                'title' => 'WiFi UMM-Hotspot Mati',
                'category' => 'IT',
                'location' => 'Perpustakaan Pusat',
                'description' => 'Koneksi internet tidak bisa terhubung sejak jam 8 pagi.',
                'status' => 'finished',
                'urgensi' => 'sedang',
                'kode_tiket' => 'RPT-20260425-0002'
            ],
            [
                'title' => 'Lampu Parkir Basement Mati',
                'category' => 'Fasilitas',
                'location' => 'Parkir Basement GKB 4',
                'description' => 'Kondisi sangat gelap, rawan kecelakaan dan kriminalitas.',
                'status' => 'pending',
                'urgensi' => 'tinggi',
                'kode_tiket' => 'RPT-20260425-0003'
            ],
            [
                'title' => 'Keran Air Musholla Rusak',
                'category' => 'Umum',
                'location' => 'Musholla GKB 2',
                'description' => 'Keran tidak bisa ditutup rapat, air terbuang percuma.',
                'status' => 'pending',
                'urgensi' => 'rendah',
                'kode_tiket' => 'RPT-20260425-0004'
            ]
        ];

        foreach ($reports as $r) {
            $mhs->reports()->updateOrCreate(
                ['kode_tiket' => $r['kode_tiket']],
                array_merge($r, ['sla_expires_at' => now()->addHours(48)])
            );
        }

        // 3. Lost & Found
        LostFound::updateOrCreate(
            ['title' => 'Kunci Motor Honda'],
            [
                'user_id' => $mhs->id,
                'type' => 'found',
                'location' => 'Lobby GKB 3',
                'time_info' => 'Tadi Siang 12:30',
                'description' => 'Ditemukan kunci motor dengan gantungan spiderman.',
                'status' => 'active'
            ]
        );

        LostFound::updateOrCreate(
            ['title' => 'KTM An. Ahmad Fauzi'],
            [
                'user_id' => $mhs->id,
                'type' => 'lost',
                'location' => 'Sekitar Masjid AR Fachruddin',
                'time_info' => 'Senin Sore',
                'description' => 'KTM hilang, mungkin terjatuh saat sholat.',
                'status' => 'active'
            ]
        );

        // 4. Notifications
        $mhs->notifications()->create([
            'title' => 'Laporan Diproses',
            'message' => 'Laporan AC Bocor Anda sedang ditangani oleh petugas.',
            'is_read' => false
        ]);

        $mhs->notifications()->create([
            'title' => 'Laporan Selesai',
            'message' => 'Laporan WiFi Mati telah diselesaikan. Silakan berikan rating.',
            'is_read' => true
        ]);
    }
}
