import type { IMasteryRepository } from '../domain/IMastery.repository';
import type { Boite } from '../domain/LeitnerBox';
import { nextBox } from '../domain/LeitnerBox';

export class MiseAJourDeMaitrise {
  constructor(private readonly mastery: IMasteryRepository) {}

  async appliquer(
    studentKey: string,
    concept: string,
    reussi: boolean,
  ): Promise<void> {
    const existants = await this.mastery.findByStudentKey(studentKey);
    const courant = existants.find((entree) => entree.concept === concept);
    const boite: Boite = courant ? courant.boite : 1;
    await this.mastery.upsert({
      studentKey,
      concept,
      boite: nextBox(boite, reussi),
      derniereVue: new Date(),
      succes: (courant?.succes ?? 0) + (reussi ? 1 : 0),
      echecs: (courant?.echecs ?? 0) + (reussi ? 0 : 1),
    });
  }
}
