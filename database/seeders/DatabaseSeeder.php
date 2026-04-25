<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin Manajemen
        User::create([
            'name' => 'Admin Manajemen',
            'email' => 'admin@umm.ac.id',
            'password' => Hash::make('password'),
            'role' => 'manajemen',
        ]);

        // Petugas Lapangan
        User::create([
            'name' => 'Petugas Keamanan',
            'email' => 'petugas@umm.ac.id',
            'password' => Hash::make('password'),
            'role' => 'petugas',
        ]);

        // Mahasiswa Demo
        User::create([
            'name' => 'Mahasiswa UMM',
            'email' => 'mhs@umm.ac.id',
            'nim' => '202110370311001',
            'password' => Hash::make('password'),
            'role' => 'mahasiswa',
            'fakultas' => 'Teknik',
            'prodi' => 'Informatika',
        ]);
        
        // Initial Units
        \App\Models\Unit::create([
            'nama_unit' => 'Biro Sistem Informasi (BSI)',
            'kode_unit' => 'BSI-UMM',
            'email_pic' => 'bsi@umm.ac.id',
            'sla_jam' => 24
        ]);
        
        \App\Models\Unit::create([
            'nama_unit' => 'Sarana & Prasarana',
            'kode_unit' => 'SARPRAS-UMM',
            'email_pic' => 'sarpras@umm.ac.id',
            'sla_jam' => 48
        ]);

        \App\Models\Unit::create([
            'nama_unit' => 'Keamanan & Ketertiban',
            'kode_unit' => 'SECURITY-UMM',
            'email_pic' => 'security@umm.ac.id',
            'sla_jam' => 12
        ]);
    }
}
