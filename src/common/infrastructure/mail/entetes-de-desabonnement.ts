export function adresseNue(adresse: string): string {
  const ouverture = adresse.indexOf('<');
  const fermeture = adresse.indexOf('>', ouverture + 1);
  if (ouverture < 0 || fermeture < 0) return adresse.trim();
  return adresse.slice(ouverture + 1, fermeture).trim();
}

/**
 * En-tetes de desabonnement RFC 8058, exiges par Gmail des expediteurs
 * en nombre depuis 2024. Leur absence degrade la delivrabilite.
 *
 * `List-Unsubscribe-Post` engage l'API a traiter un POST non
 * authentifie sur l'URL fournie : l'endpoint
 * `POST /newsletter/unsubscribe` existe pour cela. Annoncer l'en-tete
 * sans cet endpoint ferait echouer le bouton natif du client mail.
 *
 * L'adresse mailto doit etre nue : un reply-to de la forme
 * `Nom <adresse>` produirait un `mailto:` malforme.
 *
 * La RFC 8058 §4 impose en outre qu'ils soient couverts par la signature
 * DKIM (tag `h=`) : la signature etant assuree par le relais SMTP et non
 * par nodemailer ici, ce point reste a verifier cote relais.
 */
export function entetesDeDesabonnement(
  replyTo: string,
  lienDeDesabonnement: string,
): Record<string, string> {
  return {
    'List-Unsubscribe': `<mailto:${adresseNue(replyTo)}?subject=unsubscribe>, <${lienDeDesabonnement}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}
