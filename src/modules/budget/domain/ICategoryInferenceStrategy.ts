/**
 * Port domaine pour l'inference de la categorie de budget a partir d'un libelle
 * (description) et metadonnees d'une entree (type Revolut, signe du montant).
 *
 * Permet de remplacer la logique d'inference par toute autre implementation
 * (basee regex, ML, service externe) sans toucher au use case d'import. La regle
 * d'inference est volontairement decouplee de la couche application : les
 * keywords reels (souvent des donnees personnelles : noms de banque, prestataires,
 * colocataires) sont externalises dans la couche infrastructure ou dans une
 * configuration utilisateur (variable d'environnement).
 */
export interface ICategoryInferenceStrategy {
  /**
   * Retourne le nom de categorie infere pour une entree, ou null/'Autres' si aucun
   * pattern ne s'applique. La signature reste agnostique au format CSV source.
   *
   * @param description - libelle brut tel qu'extrait du CSV (jamais normalise par l'appelant)
   * @param type - type Revolut (ex: 'TRANSFER', 'CARD_PAYMENT', etc.)
   * @param amount - montant signe (negatif = depense, positif = revenu)
   */
  infer(description: string, type: string, amount: number): string | null;
}
