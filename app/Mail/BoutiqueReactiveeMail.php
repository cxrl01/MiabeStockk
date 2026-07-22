<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BoutiqueReactiveeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $gerant,
        public string $nomBoutique,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Votre boutique a été réactivée sur MiabéStock',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.boutique-reactivee',
            with: [
                'prenom' => $this->gerant->prenom,
                'nomBoutique' => $this->nomBoutique,
                'urlConnexion' => url('/connexion'),
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}