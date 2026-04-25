<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BugReport extends Model
{
    use HasUuids;

    protected $fillable = ['report_id', 'browser', 'device', 'error_msg', 'technical_log'];

    public function report(): BelongsTo { return $this->belongsTo(Report::class); }
}
