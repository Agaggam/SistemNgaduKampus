<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Assignment extends Model
{
    use HasUuids;

    protected $fillable = [
        'report_id',
        'unit_id',
        'petugas_id',
        'catatan',
        'assigned_at',
        'deadline_at',
        'status',
        'metadata',
    ];


    protected $casts = [
        'assigned_at' => 'datetime',
        'deadline_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function petugas(): BelongsTo
    {
        return $this->belongsTo(User::class, 'petugas_id');
    }
}
