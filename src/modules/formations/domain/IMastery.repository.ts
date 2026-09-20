import type { Boite } from './LeitnerBox';

export interface MasteryRecord {
  studentKey: string;
  concept: string;
  boite: Boite;
  derniereVue: Date;
  succes: number;
  echecs: number;
}

export interface TentativeDeMaitrise {
  readonly studentKey: string;
  readonly concept: string;
  readonly reussi: boolean;
  readonly vueLe: Date;
}

export interface IMasteryRepository {
  findByStudentKey(studentKey: string): Promise<readonly MasteryRecord[]>;
  enregistrerTentative(tentative: TentativeDeMaitrise): Promise<void>;
}
