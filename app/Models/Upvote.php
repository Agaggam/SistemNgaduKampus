<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Upvote extends Model
{
    use HasUuids;

    protected $fillable = ['report_id', 'user_id'];

    public function report(): BelongsTo { return $this->belongsTo(Report::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
