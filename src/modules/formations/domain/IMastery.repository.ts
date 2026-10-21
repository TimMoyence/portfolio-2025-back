import type { Boite } from './LeitnerBox';

export interface MasteryRecord {
  studentKey: string;
  concept: string;
  boite: Boite;
  succes: number;
  echecs: number;
}

export interface TentativeDeMaitrise {
  readonly studentKey: string;
  readonly concept: string;
  readonly reussi: boolean;
}

export interface IMasteryRepository {
  findByStudentKey(studentKey: string): Promise<readonly MasteryRecord[]>;
  enregistrerTentative(tentative: TentativeDeMaitrise): Promise<void>;
}
