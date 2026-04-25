<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Unit extends Model
{
    use HasUuids;

    protected $fillable = [
        'nama_unit',
        'kode_unit',
        'email_pic',
        'sla_jam',
    ];

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }
}
