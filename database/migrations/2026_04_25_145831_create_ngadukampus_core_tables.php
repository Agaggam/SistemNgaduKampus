<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. USERS (Refactored to UUID)
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('nim')->nullable()->unique();
            $table->string('fakultas')->nullable();
            $table->string('prodi')->nullable();
            $table->string('angkatan')->nullable();
            $table->enum('role', ['mahasiswa', 'petugas', 'manajemen'])->default('mahasiswa');
            $table->string('password');
            $table->json('metadata')->nullable(); // Flexibility
            $table->string('sso_token')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        // 2. UNITS
        Schema::create('units', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nama_unit');
            $table->string('kode_unit')->unique();
            $table->string('email_pic')->nullable();
            $table->integer('sla_jam')->default(48);
            $table->timestamps();
        });

        // 3. REPORTS (LAPORAN)
        Schema::create('reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('mode', ['reguler', 'anonim'])->default('reguler');
            $table->string('category')->default('Umum');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('location')->nullable();
            $table->enum('urgensi', ['rendah', 'sedang', 'tinggi', 'darurat'])->default('sedang');
            $table->enum('status', ['pending', 'process', 'finished'])->default('pending');
            $table->string('kode_tiket')->unique();
            $table->timestamp('sla_expires_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        // 4. LOST_FOUND
        Schema::create('lost_founds', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('type', ['lost', 'found']);
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('location');
            $table->string('time_info')->nullable();
            $table->string('foto_url')->nullable();
            $table->enum('status', ['active', 'resolved'])->default('active');
            $table->timestamps();
        });

        // 5. PANIC_ALERTS
        Schema::create('panic_alerts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->float('lat', 10, 6)->nullable();
            $table->float('lng', 10, 6)->nullable();
            $table->string('location_name')->nullable();
            $table->enum('jenis_darurat', ['medis', 'keamanan', 'kebakaran', 'lainnya'])->default('keamanan');
            $table->enum('status', ['active', 'resolved'])->default('active');
            $table->timestamps();
        });

        // 6. TIMELINES
        Schema::create('timelines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('report_id')->constrained('reports')->onDelete('cascade');
            $table->foreignUuid('user_id')->nullable()->constrained('users'); // Aktor pelaksana
            $table->string('status_baru');
            $table->text('catatan')->nullable();
            $table->timestamps();
        });

        // 7. NOTIFICATIONS
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('report_id')->nullable()->constrained('reports')->onDelete('set null');
            $table->string('title');
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });

        // 8. ASSIGNMENTS (PENUGASAN)
        Schema::create('assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('report_id')->constrained('reports')->onDelete('cascade');
            $table->foreignUuid('unit_id')->nullable()->constrained('units')->onDelete('cascade');
            $table->foreignUuid('petugas_id')->nullable()->constrained('users');
            $table->text('catatan')->nullable();
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('deadline_at')->nullable();
            $table->enum('status', ['pending', 'on_progress', 'completed'])->default('pending');
            $table->timestamps();
        });


        // 9. UPVOTES
        Schema::create('upvotes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('report_id')->constrained('reports')->onDelete('cascade');
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });

        // 10. ATTACHMENTS (LAMPIRAN)
        Schema::create('attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('report_id')->constrained('reports')->onDelete('cascade');
            $table->string('file_url');
            $table->string('file_type')->nullable();
            $table->timestamps();
        });

        // 11. RATINGS
        Schema::create('ratings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('report_id')->unique()->constrained('reports')->onDelete('cascade');
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->integer('score')->default(5);
            $table->text('comment')->nullable();
            $table->timestamps();
        });

        // 12. BUG_REPORTS
        Schema::create('bug_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('report_id')->unique()->constrained('reports')->onDelete('cascade');
            $table->string('browser')->nullable();
            $table->string('device')->nullable();
            $table->string('error_msg')->nullable();
            $table->text('technical_log')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bug_reports');
        Schema::dropIfExists('ratings');
        Schema::dropIfExists('attachments');
        Schema::dropIfExists('upvotes');
        Schema::dropIfExists('assignments');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('timelines');
        Schema::dropIfExists('panic_alerts');
        Schema::dropIfExists('lost_founds');
        Schema::dropIfExists('reports');
        Schema::dropIfExists('units');
        Schema::dropIfExists('users');
    }
};
