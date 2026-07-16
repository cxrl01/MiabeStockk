<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    use HasFactory;

    public $timestamps = true;
    const UPDATED_AT = null; // journal append-only, pas de mise à jour

    protected $fillable = [
        'user_id', 'boutique_id', 'action', 'sujet_type', 'sujet_id', 'donnees', 'ip_adresse',
    ];

    protected function casts(): array
    {
        return ['donnees' => 'array'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class);
    }
}