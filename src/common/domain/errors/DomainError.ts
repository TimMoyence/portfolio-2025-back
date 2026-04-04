/**
 * Classe de base abstraite pour les erreurs du domaine metier.
 * Toutes les erreurs domaine heritent de cette classe, ce qui permet
 * au filtre global DomainExceptionFilter de les intercepter et de
 * les mapper vers le code HTTP correspondant.
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
