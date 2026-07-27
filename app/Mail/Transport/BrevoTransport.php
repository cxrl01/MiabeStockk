<?php

namespace App\Mail\Transport;

use Illuminate\Support\Facades\Http;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\MessageConverter;

/**
 * Envoie les emails via l'API HTTP de Brevo (https://api.brevo.com),
 * au lieu du SMTP classique — utile car Render bloque les ports SMTP
 * sortants (25/465/587) sur son plan gratuit, mais pas le HTTPS.
 */
class BrevoTransport extends AbstractTransport
{
    public function __construct(private string $apiKey)
    {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());

        $payload = [
            'sender' => $this->formatAddress($email->getFrom()[0]),
            'to' => array_map($this->formatAddress(...), $email->getTo()),
            'subject' => $email->getSubject(),
        ];

        if ($html = $email->getHtmlBody()) {
            $payload['htmlContent'] = $html;
        }
        if ($text = $email->getTextBody()) {
            $payload['textContent'] = $text;
        }
        if ($replyTo = $email->getReplyTo()) {
            $payload['replyTo'] = $this->formatAddress($replyTo[0]);
        }

        $response = Http::withHeaders([
            'api-key' => $this->apiKey,
            'accept' => 'application/json',
            'content-type' => 'application/json',
        ])->post('https://api.brevo.com/v3/smtp/email', $payload);

        if ($response->failed()) {
            throw new \RuntimeException(
                'Echec envoi email via Brevo : '.$response->body()
            );
        }
    }

    private function formatAddress(Address $address): array
    {
        return array_filter([
            'email' => $address->getAddress(),
            'name' => $address->getName() ?: null,
        ]);
    }

    public function __toString(): string
    {
        return 'brevo+api';
    }
}