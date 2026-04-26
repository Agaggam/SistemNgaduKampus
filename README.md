# NgaduKampus UMM 
Sistem Informasi Pengaduan & Keamanan Kampus Terpadu berbasis Laravel & Vanilla JS.

## Fitur Utama
- **Smart Complaint**: Auto-kategori berbasis teks & Auto-save draf.
- **Lost & Found Center**: Katalog barang hilang/temu dengan fitur resolusi.
- **Panic Button (SOS)**: Sinyal darurat real-time dengan koordinat GPS.
- **SLA Tracking**: Pemantauan durasi penanganan laporan secara otomatis.
- **Account Management**: Dashboard khusus Mahasiswa, Petugas, dan Manajemen.

---

## Hasil Pengujian Kualitas (Testing Report)

| Aspek Kualitas | Fitur / Fungsi | Skenario Uji | Status | Hasil yang Diharapkan |
| :--- | :--- | :--- | :---: | :--- |
| **Functionality** | Lapor Aduan | Mengirim aduan dengan gambar & mode anonim | ✅ Lulus | Data tersimpan di DB & gambar muncul di dashboard |
| | Lost & Found Center | Menandai barang "Selesai" oleh pemilik/petugas | ✅ Lulus | Status barang berubah menjadi 'Resolved' |
| | Manajemen Akun | Create, Read, Update, Delete (CRUD) User | ✅ Lulus | Perubahan data user tercermin real-time di tabel |
| **Usability** | Auto-Save Draft | Menulis laporan lalu refresh halaman | ✅ Lulus | Teks laporan tidak hilang (tersimpan di localStorage) |
| | Smart Category | Mengetik kata "Wifi" di judul laporan | ✅ Lulus | Kategori otomatis berubah menjadi 'IT' |
| | Dark Mode | Berpindah tema dari sidebar settings | ✅ Lulus | UI berubah warna & preferensi tersimpan |
| **Reliability** | Validasi Form | Menginput email yang sudah terdaftar | ✅ Lulus | Muncul notifikasi toast "The email has already been taken" |
| | View Persistence | Refresh halaman saat di posisi 'Kelola Akun' | ✅ Lulus | Halaman tetap di 'Kelola Akun', tidak balik ke dashboard |
| **Security** | Role-Based Access | Petugas mencoba buka menu 'Kelola Akun' | ✅ Lulus | Akses ditolak & di-redirect otomatis |
| | Password Hashing | Cek data password di database | ✅ Lulus | Password tersimpan dalam bentuk Bcrypt (aman) |
| **Performance** | Real-time Sync | Perubahan status laporan dari petugas | ✅ Lulus | Dashboard manajemen terupdate otomatis (polling 10s) |

---

## Cara Instalasi (Local)
1. Clone repository
2. Jalankan `composer install`
3. Salin `.env.example` ke `.env` & sesuaikan DB
4. Jalankan `php artisan key:generate`
5. Jalankan `php artisan migrate --seed`
6. Jalankan `php artisan serve`

## Deployment (Hosting)
Untuk deployment di shared hosting (seperti InfinityFree), gunakan helper yang tersedia:
- `/migrasi-aman-bos` : Menjalankan migrasi tanpa SSH.
- `/link-storage-bos` : Membuat symbolic link folder storage.
- `/fix-storage-bos` : Membersihkan cache & menyiapkan folder sessions.
