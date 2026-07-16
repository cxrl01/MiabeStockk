export function formatMontant(valeur) {
    return `${new Intl.NumberFormat('fr-FR').format(Math.round(valeur))} F`;
  }
  
  export function formatHeure(dateIso) {
    return new Date(dateIso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }