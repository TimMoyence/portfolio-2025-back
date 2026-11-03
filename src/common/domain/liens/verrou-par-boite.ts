export interface VerrouParBoite<Depot> {
  sousVerrouDeLaBoite<T>(
    destinataire: string,
    travail: (depot: Depot) => Promise<T>,
  ): Promise<T>;
}
