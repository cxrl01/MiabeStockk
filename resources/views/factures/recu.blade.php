<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Reçu {{ $paiement->numero_facture }}</title>
    <style>
        @page { margin: 30px 40px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1a1a1a; }

        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1a1a1a; padding-bottom: 14px; }
        .boutique-nom { font-size: 16px; font-weight: bold; }
        .boutique-info { color: #555; font-size: 11px; }

        .titre { font-size: 18px; font-weight: bold; text-align: center; margin: 16px 0 4px; }
        .numero { text-align: center; color: #555; margin-bottom: 20px; }

        table.details { width: 100%; border-collapse: collapse; margin-top: 10px; }
        table.details td { padding: 8px 4px; border-bottom: 1px solid #eee; }
        table.details td.label { color: #888; width: 45%; }
        table.details td.valeur { text-align: right; font-weight: 600; }

        .montant-box { text-align: center; margin: 24px 0; padding: 16px; background: #f5f5f5; border-radius: 4px; }
        .montant-box .montant { font-size: 24px; font-weight: bold; }
        .montant-box .libelle { font-size: 10px; text-transform: uppercase; color: #888; }

        .solde { margin-top: 20px; text-align: center; }
        .solde .solde-restant { color: #b91c1c; font-weight: bold; }
        .solde .solde-nul { color: #15803d; font-weight: bold; }

        .footer { margin-top: 40px; text-align: center; color: #999; font-size: 10px; }
    </style>
</head>
<body>

    <div class="header">
        <div class="boutique-nom">{{ $paiement->commande->boutique->nom }}</div>
        <div class="boutique-info">
            @if($paiement->commande->boutique->adresse) {{ $paiement->commande->boutique->adresse }} @endif
            @if($paiement->commande->boutique->telephone) — Tél : {{ $paiement->commande->boutique->telephone }} @endif
        </div>
    </div>

    <div class="titre">REÇU DE PAIEMENT</div>
    <div class="numero">N° {{ $paiement->numero_facture }}</div>

    <table class="details">
        <tr>
            <td class="label">Date du paiement</td>
            <td class="valeur">{{ \Carbon\Carbon::parse($paiement->created_at)->translatedFormat('d F Y à H:i') }}</td>
        </tr>
        <tr>
            <td class="label">Vente concernée</td>
            <td class="valeur">{{ $paiement->commande->numero }}</td>
        </tr>
        <tr>
            <td class="label">Client</td>
            <td class="valeur">{{ $paiement->commande->client->nom ?? 'Client comptant' }}</td>
        </tr>
        <tr>
            <td class="label">Mode de paiement</td>
            <td class="valeur">{{ ucfirst(str_replace('_', ' ', $paiement->mode)) }}</td>
        </tr>
        @if($paiement->reference)
        <tr>
            <td class="label">Référence</td>
            <td class="valeur">{{ $paiement->reference }}</td>
        </tr>
        @endif
        <tr>
            <td class="label">Encaissé par</td>
            <td class="valeur">{{ $paiement->user->nom }}</td>
        </tr>
    </table>

    <div class="montant-box">
        <div class="libelle">Montant payé</div>
        <div class="montant">{{ number_format($paiement->montant, 0, ',', ' ') }} F</div>
    </div>

    <div class="solde">
        @php $solde = $paiement->commande->montant_ttc - $paiement->commande->montant_paye; @endphp
        Solde restant sur la vente {{ $paiement->commande->numero }} :
        <span class="{{ $solde > 0 ? 'solde-restant' : 'solde-nul' }}">
            {{ number_format($solde, 0, ',', ' ') }} F
        </span>
    </div>

    <div class="footer">
        Reçu généré par MiabéStock — {{ $paiement->commande->boutique->nom }}
    </div>

</body>
</html>