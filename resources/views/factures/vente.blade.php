<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Facture {{ $vente->numero }}</title>
    <style>
        @page { margin: 30px 40px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1a1a1a; }

        .header { display: flex; justify-content: space-between; margin-bottom: 24px; border-bottom: 2px solid #1a1a1a; padding-bottom: 14px; }
        .header table { width: 100%; }
        .boutique-nom { font-size: 18px; font-weight: bold; }
        .boutique-info { color: #555; line-height: 1.5; }
        .facture-titre { font-size: 20px; font-weight: bold; text-align: right; }
        .facture-meta { text-align: right; color: #555; line-height: 1.6; }

        .bloc-client { margin: 20px 0; }
        .bloc-client-label { text-transform: uppercase; font-size: 10px; color: #888; margin-bottom: 4px; }

        table.lignes { width: 100%; border-collapse: collapse; margin-top: 10px; }
        table.lignes th { text-align: left; font-size: 10px; text-transform: uppercase; color: #888; border-bottom: 1px solid #ccc; padding: 6px 4px; }
        table.lignes td { padding: 8px 4px; border-bottom: 1px solid #eee; }
        table.lignes .num { text-align: right; }

        .totaux { width: 260px; margin-left: auto; margin-top: 16px; }
        .totaux table { width: 100%; }
        .totaux td { padding: 4px 0; }
        .totaux .num { text-align: right; }
        .totaux .total-ttc td { border-top: 2px solid #1a1a1a; font-size: 14px; font-weight: bold; padding-top: 8px; }

        .paiement { margin-top: 24px; padding: 12px 14px; background: #f5f5f5; border-radius: 4px; }
        .paiement .solde-restant { color: #b91c1c; font-weight: bold; }
        .paiement .solde-nul { color: #15803d; font-weight: bold; }

        .footer { margin-top: 40px; text-align: center; color: #999; font-size: 10px; }
    </style>
</head>
<body>

    <div class="header">
        <table>
            <tr>
                <td style="width: 60%;">
                    <div class="boutique-nom">{{ $vente->boutique->nom }}</div>
                    <div class="boutique-info">
                        @if($vente->boutique->adresse)
                            {{ $vente->boutique->adresse }}<br>
                        @endif
                        @if($vente->boutique->telephone)
                            Tél : {{ $vente->boutique->telephone }}<br>
                        @endif
                        TVA : {{ number_format($vente->boutique->tva, 2, ',', ' ') }} %
                    </div>
                </td>
                <td style="width: 40%;">
                    <div class="facture-titre">FACTURE</div>
                    <div class="facture-meta">
                        N° {{ $vente->numero }}<br>
                        {{ \Carbon\Carbon::parse($vente->created_at)->translatedFormat('d F Y à H:i') }}
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <div class="bloc-client">
        <div class="bloc-client-label">Client</div>
        <div>
            @if($vente->client)
                <strong>{{ $vente->client->nom }}</strong>
                @if($vente->client->telephone) — {{ $vente->client->telephone }} @endif
            @else
                Client comptant
            @endif
        </div>
    </div>

    <table class="lignes">
        <thead>
            <tr>
                <th>Produit</th>
                <th class="num">Qté</th>
                <th class="num">Prix unitaire</th>
                <th class="num">Montant HT</th>
                <th class="num">Montant TTC</th>
            </tr>
        </thead>
        <tbody>
            @foreach($vente->lignes as $ligne)
                <tr>
                    <td>{{ $ligne->produit->nom }}</td>
                    <td class="num">{{ $ligne->quantite }}</td>
                    <td class="num">{{ number_format($ligne->prix_unitaire, 0, ',', ' ') }} F</td>
                    <td class="num">{{ number_format($ligne->montant_ht, 0, ',', ' ') }} F</td>
                    <td class="num">{{ number_format($ligne->montant_ttc, 0, ',', ' ') }} F</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totaux">
        <table>
            <tr>
                <td>Sous-total HT</td>
                <td class="num">{{ number_format($vente->montant_ht, 0, ',', ' ') }} F</td>
            </tr>
            <tr>
                <td>TVA</td>
                <td class="num">{{ number_format($vente->montant_tva, 0, ',', ' ') }} F</td>
            </tr>
            <tr class="total-ttc">
                <td>Total TTC</td>
                <td class="num">{{ number_format($vente->montant_ttc, 0, ',', ' ') }} F</td>
            </tr>
        </table>
    </div>

    <div class="paiement">
        @php $solde = $vente->montant_ttc - $vente->montant_paye; @endphp
        Montant payé : {{ number_format($vente->montant_paye, 0, ',', ' ') }} F
        @if($vente->paiements->isNotEmpty())
            ({{ ucfirst(str_replace('_', ' ', $vente->paiements->last()->mode)) }})
        @endif
        <br>
        Solde restant :
        <span class="{{ $solde > 0 ? 'solde-restant' : 'solde-nul' }}">
            {{ number_format($solde, 0, ',', ' ') }} F
        </span>
    </div>

    <div class="footer">
        Facture générée par MiabéStock — {{ $vente->boutique->nom }}
    </div>

</body>
</html>