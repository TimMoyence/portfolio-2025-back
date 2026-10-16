import type { Type } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import {
  DocumentBuilder,
  type SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { Test } from '@nestjs/testing';
import { getMetadataStorage, type MetadataStorage } from 'class-validator';
import { readdirSync } from 'fs';
import { join } from 'path';
import type { SchemaOpenApi } from './schema-openapi';
import { collectFiles } from './source-tree';

export type Contrainte = Parameters<
  MetadataStorage['addValidationMetadata']
>[0];
export type Modele = NonNullable<SwaggerDocumentOptions['extraModels']>[number];

export const SOURCES = join(__dirname, '../../src');
export const MODULES = join(SOURCES, 'modules');

export const SAISIES = [
  join(SOURCES, 'common/interfaces'),
  ...readdirSync(MODULES).map((module) => join(MODULES, module, 'interfaces')),
].flatMap((dossier) =>
  collectFiles(dossier).filter(
    (fichier) => fichier.endsWith('.ts') && !fichier.endsWith('.spec.ts'),
  ),
);

const estUnModele = (exporte: unknown): exporte is Modele =>
  typeof exporte === 'function' &&
  typeof exporte.prototype === 'object' &&
  (
    (Reflect.getMetadata(
      DECORATORS.API_MODEL_PROPERTIES_ARRAY,
      exporte.prototype as object,
    ) ?? []) as unknown[]
  ).length > 0;

const estUnControleur = (exporte: unknown): exporte is Type =>
  typeof exporte === 'function' && Reflect.hasMetadata(PATH_METADATA, exporte);

export function chargerLesSaisies(): {
  readonly contraintes: readonly Contrainte[];
  readonly modeles: readonly Modele[];
  readonly controleurs: readonly Type[];
} {
  const stockage = getMetadataStorage();
  const ajouter = stockage.addValidationMetadata.bind(stockage);
  const contraintes: Contrainte[] = [];
  const modeles = new Set<Modele>();
  const controleurs = new Set<Type>();
  const espion = jest
    .spyOn(stockage, 'addValidationMetadata')
    .mockImplementation((metadonnee) => {
      contraintes.push(metadonnee);
      ajouter(metadonnee);
    });
  jest.isolateModules(() => {
    for (const fichier of SAISIES) {
      const exportes = Object.values(jest.requireActual<object>(fichier));
      exportes.filter(estUnModele).forEach((modele) => modeles.add(modele));
      exportes
        .filter(estUnControleur)
        .forEach((controleur) => controleurs.add(controleur));
    }
  });
  espion.mockRestore();
  contraintes
    .map(({ target }) => target)
    .filter(estUnModele)
    .forEach((modele) => modeles.add(modele));
  return { contraintes, modeles: [...modeles], controleurs: [...controleurs] };
}

export const classeDe = ({ target }: Contrainte): string =>
  typeof target === 'function' ? target.name : target;

export const nomDe = (contrainte: Contrainte): string =>
  contrainte.name ??
  getMetadataStorage().getTargetValidatorConstraints(
    contrainte.constraintCls,
  )[0]?.name ??
  contrainte.type;

export const valideLaContrainte = (
  contrainte: Contrainte,
  valeur: unknown,
): boolean =>
  getMetadataStorage()
    .getTargetValidatorConstraints(contrainte.constraintCls)
    .every(
      ({ instance }) =>
        instance.validate(valeur, {
          value: valeur,
          constraints: contrainte.constraints,
          targetName: classeDe(contrainte),
          object: {},
          property: contrainte.propertyName,
        }) === true,
    );

export async function schemasDesModeles(
  modeles: readonly Modele[],
): Promise<Map<Modele, Record<string, SchemaOpenApi>>> {
  const app = (
    await Test.createTestingModule({}).compile()
  ).createNestApplication();
  await app.init();
  try {
    return new Map(
      modeles.map((modele) => [
        modele,
        (SwaggerModule.createDocument(app, new DocumentBuilder().build(), {
          extraModels: [modele],
        }).components?.schemas ?? {}) as Record<string, SchemaOpenApi>,
      ]),
    );
  } finally {
    await app.close();
  }
}
