export function formatMontant(valeur) {
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(valeur))} F`;
}

export function formatDate(dateIso) {
  return new Date(dateIso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatHeure(dateIso) {
  return new Date(dateIso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}