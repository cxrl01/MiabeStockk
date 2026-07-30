<?php

namespace App\Services;

use Cloudinary\Cloudinary;

class CloudinaryService
{
    protected Cloudinary $cloudinary;

    public function __construct()
    {
        $this->cloudinary = new Cloudinary(config('cloudinary.cloud_url'));
    }

    public function uploader(string $cheminFichier, string $dossier, string $publicId): array
{
    $resultat = $this->cloudinary->uploadApi()->upload($cheminFichier, [
        'public_id' => $dossier . '/' . $publicId, // dossier encodé dans le public_id, pas en tant que "folder"
        'overwrite' => true,
    ]);

    return [
        'url' => $resultat['secure_url'],
        'public_id' => $resultat['public_id'],
    ];
}

    public function supprimer(string $publicId): void
    {
        $this->cloudinary->uploadApi()->destroy($publicId);
    }
}