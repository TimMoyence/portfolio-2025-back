import type { Boite } from './LeitnerBox';

export interface MasteryRecord {
  studentKey: string;
  concept: string;
  boite: Boite;
  derniereVue: Date;
  succes: number;
  echecs: number;
}

export interface IMasteryRepository {
  findByStudentKey(studentKey: string): Promise<readonly MasteryRecord[]>;
  upsert(record: MasteryRecord): Promise<void>;
}
