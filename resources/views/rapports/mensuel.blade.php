<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Rapport mensuel</title>
    <style>
        @page { margin: 30px 40px; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1a1a1a; }

        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1a1a1a; padding-bottom: 14px; }
        .boutique-nom { font-size: 18px; font-weight: bold; }
        .titre { font-size: 16px; font-weight: bold; margin: 20px 0 10px; }

        table.stats { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        table.stats td { padding: 8px 4px; border-bottom: 1px solid #eee; }
        table.stats td.label { color: #888; }
        table.stats td.valeur { text-align: right; font-weight: 600; font-family: monospace; }

        table.produits { width: 100%; border-collapse: collapse; }
        table.produits th { text-align: left; font-size: 10px; text-transform: uppercase; color: #888; border-bottom: 1px solid #ccc; padding: 6px 4px; }
        table.produits td { padding: 6px 4px; border-bottom: 1px solid #eee; }
        table.produits .num { text-align: right; }

        .resultat-net { margin-top: 20px; padding: 14px; background: #f5f5f5; border-radius: 4px; }
        .resultat-net .valeur { font-size: 18px; font-weight: bold; }
        .positif { color: #15803d; }
        .negatif { color: #b91c1c; }

        .footer { margin-top: 40px; text-align: center; color: #999; font-size: 10px; }
    </style>
</head>
<body>

    <div class="header">
        <div class="boutique-nom">{{ $boutique->nom ?? 'MiabéStock' }}</div>
        <div>Rapport mensuel — {{ \Carbon\Carbon::now()->translatedFormat('F Y') }}</div>
    </div>

    <div class="titre">Indicateurs clés</div>
    <table class="stats">
        <tr>
            <td class="label">Chiffre d'affaires du mois</td>
            <td class="valeur">{{ number_format($statistiques['ca_mois'], 0, ',', ' ') }} F</td>
        </tr>
        <tr>
            <td class="label">Ventes totales (année en cours)</td>
            <td class="valeur">{{ $statistiques['ventes_totales_annee'] }}</td>
        </tr>
        <tr>
            <td class="label">Nouveaux clients ce mois</td>
            <td class="valeur">{{ $statistiques['nouveaux_clients_mois'] }}</td>
        </tr>
        <tr>
            <td class="label">Produits vendus ce mois</td>
            <td class="valeur">{{ $statistiques['produits_vendus_mois'] }}</td>
        </tr>
    </table>

    <div class="titre">Top 5 produits (année en cours)</div>
    <table class="produits">
        <thead>
            <tr>
                <th>Produit</th>
                <th class="num">Quantité vendue</th>
                <th class="num">Montant total</th>
            </tr>
        </thead>
        <tbody>
            @forelse($statistiques['top_produits'] as $p)
                <tr>
                    <td>{{ $p['nom'] }}</td>
                    <td class="num">{{ $p['quantite_vendue'] }}</td>
                    <td class="num">{{ number_format($p['montant_total'], 0, ',', ' ') }} F</td>
                </tr>
            @empty
                <tr><td colspan="3">Aucune vente sur la période.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="titre">Résultat net — {{ \Carbon\Carbon::parse($resultat['periode']['debut'])->format('d/m/Y') }} au {{ \Carbon\Carbon::parse($resultat['periode']['fin'])->format('d/m/Y') }}</div>
    <table class="stats">
        <tr>
            <td class="label">Chiffre d'affaires</td>
            <td class="valeur">{{ number_format($resultat['chiffre_affaires'], 0, ',', ' ') }} F</td>
        </tr>
        <tr>
            <td class="label">Coût des livraisons</td>
            <td class="valeur">− {{ number_format($resultat['cout_livraisons'], 0, ',', ' ') }} F</td>
        </tr>
        <tr>
            <td class="label">Dépenses</td>
            <td class="valeur">− {{ number_format($resultat['depenses'], 0, ',', ' ') }} F</td>
        </tr>
    </table>

    <div class="resultat-net">
        Résultat net :
        <span class="valeur {{ $resultat['resultat_net'] >= 0 ? 'positif' : 'negatif' }}">
            {{ number_format($resultat['resultat_net'], 0, ',', ' ') }} F
        </span>
    </div>

    <div class="footer">
        Rapport généré par MiabéStock — {{ $boutique->nom ?? '' }}
    </div>

</body>
</html>