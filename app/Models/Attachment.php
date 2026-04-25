<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attachment extends Model
{
    use HasUuids;

    protected $fillable = ['report_id', 'file_url', 'file_type'];

    public function report(): BelongsTo { return $this->belongsTo(Report::class); }
}
