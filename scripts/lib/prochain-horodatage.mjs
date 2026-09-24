/**
 * @param {string[]} fichiers
 * @param {number} maintenant
 * @returns {number}
 */
export function prochainHorodatage(fichiers, maintenant) {
  const derniere = Math.max(
    0,
    ...fichiers.map((nom) => Number(nom.split('-')[0])),
  );
  return Math.max(maintenant, derniere + 1);
}
