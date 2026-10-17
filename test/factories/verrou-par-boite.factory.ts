import type { VerrouParBoite } from '../../src/common/domain/verrou-par-boite';

export const ADRESSE_A_BOITE_PLUS_LONGUE_QUE_255 = `${'l'.repeat(64)}@${[
  'àçîõýĉėĥĵłŏŝūźεμτбип',
  'íôüćĕģıŀōśũŷδλσазохь',
  'ûąēġįľŋřŧŵγκρωжнфыâé',
  'đğĭļŉŗťųβιπψемуъáèïö',
  'fr',
].join('.')}`;

export function sectionSurLeDepot<D>(
  depotDeLaSection: () => NoInfer<D>,
  aLaFinDeLaSection: () => void = () => undefined,
): jest.Mocked<VerrouParBoite<D>>['sousVerrouDeLaBoite'] {
  return jest.fn(
    async (_destinataire: string, travail: (depot: D) => Promise<unknown>) => {
      const resultat = await travail(depotDeLaSection());
      aLaFinDeLaSection();
      return resultat;
    },
  ) as unknown as jest.Mocked<VerrouParBoite<D>>['sousVerrouDeLaBoite'];
}
