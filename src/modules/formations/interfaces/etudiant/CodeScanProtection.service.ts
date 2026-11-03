import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

const FENETRE_MS = 60_000;
const MAX_ECHECS_PAR_FENETRE = 20;
const MAX_ADRESSES_SUIVIES = 1_000;

interface Compteur {
  echecs: number;
  expireLe: number;
}

/**
 * Le code de seance ne fait que quatre chiffres : sans garde-fou, un poste
 * peut les enumerer et entrer dans la classe voisine. La limite par adresse
 * qui protegeait l'inscription a du ceder la place a une limite par code
 * (formations-throttling.ts), parce qu'une salle entiere partage une seule
 * adresse publique.
 *
 * Ce compteur restitue la protection perdue sans la faire payer a la
 * classe : seules les tentatives sur un code *inconnu* sont comptees. Trente
 * etudiants qui saisissent le bon code ne consomment rien ; un balayage
 * s'arrete au vingtieme code errone et met plus de sept heures a couvrir les
 * neuf mille codes possibles, quand une seance en dure moins d'une.
 */
@Injectable()
export class CodeScanProtectionService {
  private readonly compteurs = new Map<string, Compteur>();

  assertPasDeBalayage(adresse: string, maintenant: number = Date.now()): void {
    const compteur = this.compteurs.get(adresse);
    if (
      compteur !== undefined &&
      compteur.expireLe > maintenant &&
      compteur.echecs >= MAX_ECHECS_PAR_FENETRE
    ) {
      throw new HttpException(
        'Trop de codes de séance erronés depuis ce poste. Patientez une minute avant de réessayer.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  enregistrerEchec(adresse: string, maintenant: number = Date.now()): void {
    this.purger(maintenant);
    const courant = this.compteurs.get(adresse);
    const encoreOuvert = courant !== undefined && courant.expireLe > maintenant;
    this.compteurs.set(adresse, {
      echecs: encoreOuvert ? courant.echecs + 1 : 1,
      expireLe: encoreOuvert ? courant.expireLe : maintenant + FENETRE_MS,
    });
  }

  private purger(maintenant: number): void {
    if (this.compteurs.size < MAX_ADRESSES_SUIVIES) {
      return;
    }
    for (const [adresse, compteur] of this.compteurs) {
      if (compteur.expireLe <= maintenant) {
        this.compteurs.delete(adresse);
      }
    }
  }
}
