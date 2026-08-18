<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request as RequestFacade;

trait JournaliseActivite
{
    /**
     * Écrit une entrée dans le journal d'activité (table activity_logs,
     * ajoutée en plus du diagramme de classe car requise par les specs sécurité).
     */
    protected function journaliser(string $action, $sujet = null, array $donnees = []): void
    {
    $boutiqueId = Auth::user()?->boutique_id
        ?? ($sujet instanceof \App\Models\Boutique ? $sujet->id : $sujet?->boutique_id);

    ActivityLog::create([
        'user_id' => Auth::id(),
        'boutique_id' => $boutiqueId,
        'action' => $action,
        'sujet_type' => $sujet ? get_class($sujet) : null,
        'sujet_id' => $sujet?->id,
        'donnees' => $donnees,
        'ip_adresse' => RequestFacade::ip(),
    ]);
    }
}