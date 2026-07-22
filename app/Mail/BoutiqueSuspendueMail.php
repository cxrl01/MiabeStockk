<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BoutiqueSuspendueMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $gerant,
        public string $nomBoutique,
        public string $motif,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Votre boutique a été suspendue sur MiabéStock',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.boutique-suspendue',
            with: [
                'prenom' => $this->gerant->prenom,
                'nomBoutique' => $this->nomBoutique,
                'motif' => $this->motif,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}