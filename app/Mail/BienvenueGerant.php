<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BienvenueGerant extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Bienvenue sur MiabéStock',
        );
    }

    public function content(): Content
    {
        $boutique = $this->user->boutiquesGerees()->first();

        return new Content(
            markdown: 'emails.bienvenue-gerant',
            with: [
                'prenom' => $this->user->prenom,
                'nomBoutique' => $boutique?->nom ?? 'votre boutique',
                'multiPointsVente' => (bool) $this->user->multi_points_vente,
                'urlConnexion' => url('/connexion'),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
