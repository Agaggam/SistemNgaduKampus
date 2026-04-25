<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PanicAlert extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'lat',
        'lng',
        'location_name',
        'jenis_darurat',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
