const STYLES = {
    success: 'bg-success/10 text-success',
    danger: 'bg-danger/10 text-danger',
    warning: 'bg-warning/10 text-warning',
    neutral: 'bg-ink900/8 text-ink900/60',
  };
  
  // Fait correspondre les statuts métier (commande, paiement) à une couleur
  // de statut cohérente dans toute l'app.
  const STATUTS = {
    validee: { tone: 'success', label: 'Validée' },
    en_attente: { tone: 'warning', label: 'En attente' },
    annulee: { tone: 'danger', label: 'Annulée' },
    payee: { tone: 'success', label: 'Payée' },
    partielle: { tone: 'warning', label: 'Partielle' },
    non_payee: { tone: 'danger', label: 'Non payée' },
  };
  
  export default function Badge({ statut, tone, children }) {
    const config = statut ? STATUTS[statut] : null;
    const toneFinal = tone || config?.tone || 'neutral';
    const label = children ?? config?.label ?? statut;
  
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[toneFinal]}`}>
        {label}
      </span>
    );
  }