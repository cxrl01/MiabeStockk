import { formatMontant } from './format';

/**
 * Construit un lien wa.me (click-to-chat WhatsApp) avec un message de
 * relance pré-rempli pour un client en dette. Pas d'API WhatsApp Business
 * nécessaire — l'utilisateur clique, WhatsApp s'ouvre avec le message prêt
 * à envoyer, il valide lui-même l'envoi.
 */
export function lienRelanceWhatsapp(client, boutiqueNom) {
  if (!client.telephone) return null;

  // wa.me exige un numéro en chiffres uniquement (pas de +, espaces, tirets).
  const numero = client.telephone.replace(/[^\d]/g, '');

  const message =
    `Bonjour ${client.nom}, nous vous rappelons que vous avez une dette de ` +
    `${formatMontant(client.dette)} auprès de ${boutiqueNom}. ` +
    `Merci de régulariser votre situation dès que possible.`;

  return `https://wa.me/${numero}?text=${encodeURIComponent(message)}`;
}