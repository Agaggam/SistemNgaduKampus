<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'nim',
        'fakultas',
        'prodi',
        'angkatan',
        'role',
        'sso_token',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'metadata' => 'array',
        ];
    }

    public function reports()
    {
        return $this->hasMany(Report::class);
    }

    public function lostFounds()
    {
        return $this->hasMany(LostFound::class);
    }

    public function panicAlerts()
    {
        return $this->hasMany(PanicAlert::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function upvotes()
    {
        return $this->hasMany(Upvote::class);
    }

    public function assignments()
    {
        return $this->hasMany(Assignment::class, 'petugas_id');
    }
}
