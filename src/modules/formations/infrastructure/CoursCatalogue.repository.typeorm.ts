import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  type AuMoinsUn,
  BRIQUES_EXPOSITION,
  type BriqueExposition,
  type Cours,
  type Ecran,
  type GuideFormateur,
  questionVote,
} from '../domain/cours/Cours';
import type { ConceptId } from '../domain/cours/banque/concepts';
import type { ConfusionId } from '../domain/cours/banque/confusions';
import type { ICatalogueCours } from '../domain/cours/ICatalogueCours.port';
import { parseVisualPresentation } from '../domain/cours/VisualPresentation';
import { FormationCourseContentEntity } from './entities/FormationCourseContent.entity';
import type { FormationScreenContentEntity } from './entities/FormationScreenContent.entity';

@Injectable()
export class CoursCatalogueRepositoryTypeORM implements ICatalogueCours {
  constructor(
    @InjectRepository(FormationCourseContentEntity)
    private readonly repo: Repository<FormationCourseContentEntity>,
  ) {}

  async trouver(slug: string, version?: number): Promise<Cours | null> {
    const entity = await this.findEntity(slug, version);
    return entity === null ? null : this.toDomain(entity);
  }

  async trouverCourant(
    slug: string,
  ): Promise<{ cours: Cours; version: number } | null> {
    const entity = await this.findEntity(slug);
    return entity === null
      ? null
      : { cours: this.toDomain(entity), version: entity.version };
  }

  private async findEntity(
    slug: string,
    version?: number,
  ): Promise<FormationCourseContentEntity | null> {
    const query = this.repo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.ecrans', 'screen')
      .where('course.slug = :slug', { slug })
      .orderBy('course.version', 'DESC')
      .addOrderBy('screen.position', 'ASC');
    if (version !== undefined) {
      query.andWhere('course.version = :version', { version });
    }
    return query.getOne();
  }

  private toDomain(entity: FormationCourseContentEntity): Cours {
    const ecrans = entity.ecrans.map((screen) => this.toScreen(screen));
    if (ecrans.length === 0) {
      throw new Error(`Le cours ${entity.slug} ne contient aucun écran`);
    }
    return {
      slug: entity.slug,
      titre: entity.titre,
      niveau: entity.niveau,
      dureeMinutes: entity.dureeMinutes,
      concepts: entity.concepts as readonly [ConceptId, ...ConceptId[]],
      ecrans: ecrans as [Ecran, ...Ecran[]],
      remediations: {},
    };
  }

  private toScreen(screen: FormationScreenContentEntity): Ecran {
    if (!(BRIQUES_EXPOSITION as readonly string[]).includes(screen.brique)) {
      throw new Error(
        `Brique de formation inconnue pour ${screen.screenId}: ${screen.brique}`,
      );
    }
    const presentation = objet(screen.proprietes['presentation']);
    if (presentation?.['version'] === 2) {
      parseVisualPresentation({
        renderer: presentation['renderer'],
        props: presentation['props'],
      });
    }
    return {
      id: screen.screenId,
      brique: screen.brique as BriqueExposition,
      dureeMinutes: screen.dureeMinutes,
      concepts: screen.concepts as [ConceptId, ...ConceptId[]],
      notes: screen.notes,
      proprietes: screen.proprietes,
      question: this.toQuestion(screen.proprietes),
      guide: this.toGuide(screen.proprietes),
    } as unknown as Ecran;
  }

  private toQuestion(
    proprietes: Readonly<Record<string, unknown>>,
  ): Ecran['question'] {
    const interaction = objet(proprietes['interaction']);
    if (
      interaction === null ||
      interaction['type'] !== 'quiz' ||
      typeof interaction['id'] !== 'string' ||
      typeof interaction['question'] !== 'string' ||
      !Array.isArray(interaction['options']) ||
      !interaction['options'].every(
        (option): option is string => typeof option === 'string',
      )
    ) {
      return undefined;
    }
    const id = interaction['id'];
    const question = interaction['question'];
    const options = interaction['options'];
    const optionIds = Array.isArray(interaction['optionIds'])
      ? interaction['optionIds'].filter(
          (option): option is string => typeof option === 'string',
        )
      : options.map((_, index) => `o${index + 1}`);
    const correctIndex = interaction['correctIndex'];
    if (
      optionIds.length !== options.length ||
      typeof correctIndex !== 'number' ||
      !Number.isInteger(correctIndex) ||
      correctIndex < 0 ||
      correctIndex >= optionIds.length ||
      optionIds.length < 2
    ) {
      return undefined;
    }
    const confusions = Array.isArray(interaction['confusions'])
      ? interaction['confusions'].filter(isConfusionId)
      : [];
    const pieges = optionIds
      .map((optionId, index) => ({ optionId, index }))
      .filter(({ index }) => index !== correctIndex)
      .map(({ optionId, index }, piegeIndex) => ({
        confusion: confusions[piegeIndex] ?? 'raisonnement-additif',
        libelle: () => options[index],
        optionId: () => optionId,
      }));
    if (pieges.length === 0) {
      return undefined;
    }
    const index = correctIndex;
    return questionVote({
      id,
      concept: conceptDe(interaction['concept']),
      noteCompte: interaction['noteCompte'] !== false,
      donnees: () => undefined,
      enonce: () => question,
      bonne: () => optionIds[index],
      bonneLibelle: () => options[index],
      pieges: pieges as unknown as AuMoinsUn<{
        readonly confusion: ConfusionId;
        readonly libelle: (donnees: undefined) => string;
        readonly optionId: (donnees: undefined) => string;
      }>,
    });
  }

  private toGuide(
    proprietes: Readonly<Record<string, unknown>>,
  ): GuideFormateur | undefined {
    const guide = objet(proprietes['guide']);
    return guide === null ? undefined : (guide as GuideFormateur);
  }
}

function objet(value: unknown): Readonly<Record<string, unknown>> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : null;
}

function isConfusionId(value: unknown): value is ConfusionId {
  return typeof value === 'string';
}

function conceptDe(value: unknown): ConceptId {
  return typeof value === 'string' ? (value as ConceptId) : 'proportion';
}
