import { ValeurDuContrat } from '../../../../../common/interfaces/dto/valeur-du-contrat.decorator';
import {
  TYPES_DE_PRODUCTION,
  type TypeDeProduction,
} from '../../../domain/contrats/contrat-de-l-api';
import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  Equals,
  IsArray,
  IsNumber,
  IsObject,
  IsString,
  Validate,
  ValidateNested,
  ValidatorConstraint,
} from 'class-validator';
import type {
  ValidationArguments,
  ValidatorConstraintInterface,
} from 'class-validator';
import { LONGUEUR_MAX_FORMULE } from '../../../domain/cours/Formule';
import { estObjet } from '../../../../../common/domain/est-objet';
import { longueurDeTexte } from '../../../../../common/domain/texte/longueur-de-texte';
import {
  AuPlusElements,
  DictionnaireBorne,
  EntierBorne,
  Motif,
} from '../../../../../common/interfaces/dto/bornes-annoncees.decorator';
import {
  AuPlusCaracteres,
  TexteBorne,
} from '../../../../../common/interfaces/dto/longueur-de-texte.decorator';
import type { ValeurProduction } from '../../../domain/contrats/resultats';
import { NOM_DE_VARIABLE } from '../../../domain/cours/PlansStockes';
import { DureeDeReponse } from '../duree-de-reponse.decorator';
import { entreesBornees } from '../objet-plat';

const LONGUEUR_MAX_IDENTIFIANT = 60;
export const ENTREES_MAX = 400;

@ValidatorConstraint({ name: 'dictionnaireDeTextes', async: false })
class DictionnaireDeTextesBorne implements ValidatorConstraintInterface {
  validate(valeur: unknown, args: ValidationArguments): boolean {
    const [longueurMax] = args.constraints as [number];
    return (
      entreesBornees(valeur, ENTREES_MAX)?.every(
        ([cle, texte]) =>
          cle.length > 0 &&
          longueurDeTexte(cle) <= LONGUEUR_MAX_IDENTIFIANT &&
          typeof texte === 'string' &&
          longueurDeTexte(texte) <= longueurMax,
      ) ?? false
    );
  }

  defaultMessage(args: ValidationArguments): string {
    const [longueurMax] = args.constraints as [number];
    return `${args.property} doit associer au plus ${ENTREES_MAX} identifiants a des textes de ${longueurMax} caracteres au plus`;
  }
}

export const DictionnaireDeTextes = (longueurMax: number): PropertyDecorator =>
  applyDecorators(
    DictionnaireBorne(ENTREES_MAX, LONGUEUR_MAX_IDENTIFIANT, {
      type: 'string',
      maxLength: longueurMax,
    }),
    Validate(DictionnaireDeTextesBorne, [longueurMax]),
  );

class ProductionFeuilleDto {
  @ApiProperty({ enum: ['feuille'] })
  @Equals('feuille')
  type: 'feuille';

  @ApiProperty({
    description: 'Saisie brute de chaque cellule, formule ou valeur',
    example: { B5: '=SOMME(B2:B4)', E2: '=C2/$C$5' },
  })
  @DictionnaireDeTextes(LONGUEUR_MAX_FORMULE)
  cellules: Record<string, string>;
}

export class CelluleDeTableauDto {
  @ApiProperty({ example: 1 })
  @EntierBorne(0)
  rang: number;

  @ApiProperty({ example: 'prix' })
  @IsString()
  @Motif(NOM_DE_VARIABLE)
  @AuPlusCaracteres(LONGUEUR_MAX_IDENTIFIANT)
  cle: string;
}

class SaisieTableauDto extends CelluleDeTableauDto {
  @ApiProperty({ example: 20.52 })
  @IsNumber({ allowNaN: false, allowInfinity: false })
  valeur: number;
}

class ProductionTableauDto {
  @ApiProperty({ enum: ['tableau'] })
  @Equals('tableau')
  type: 'tableau';

  @ApiProperty({ type: [SaisieTableauDto] })
  @IsArray()
  @AuPlusElements(ENTREES_MAX)
  @ValidateNested({ each: true })
  @Type(() => SaisieTableauDto)
  saisies: SaisieTableauDto[];
}

class ProductionClassementDto {
  @ApiProperty({ enum: ['classement'] })
  @Equals('classement')
  type: 'classement';

  @ApiProperty({
    description: 'Categorie choisie pour chaque carte',
    example: { 'carte-ca-2024-2025': 'comparable' },
  })
  @DictionnaireDeTextes(LONGUEUR_MAX_IDENTIFIANT)
  classement: Record<string, string>;
}

class ProductionNeSaitPasDto {
  @ValeurDuContrat(TYPES_DE_PRODUCTION, 'TypeDeProduction')
  type: TypeDeProduction;

  @ApiProperty({ oneOf: [{ type: 'boolean', enum: [true] }] })
  @Equals(true)
  neSaitPas: true;
}

export const MODELES_DE_PRODUCTION = [
  ProductionFeuilleDto,
  ProductionTableauDto,
  ProductionClassementDto,
  ProductionNeSaitPasDto,
];

export const SCHEMAS_DE_PRODUCTION = MODELES_DE_PRODUCTION.map((modele) => ({
  $ref: getSchemaPath(modele),
}));

const CLASSE_PAR_TYPE: Readonly<Record<string, new () => object>> = {
  feuille: ProductionFeuilleDto,
  tableau: ProductionTableauDto,
  classement: ProductionClassementDto,
};

function versProduction(valeur: unknown): unknown {
  if (!estObjet(valeur)) {
    return valeur;
  }
  if ('neSaitPas' in valeur) {
    return plainToInstance(ProductionNeSaitPasDto, valeur);
  }
  const classe =
    typeof valeur.type === 'string' &&
    Object.hasOwn(CLASSE_PAR_TYPE, valeur.type)
      ? CLASSE_PAR_TYPE[valeur.type]
      : undefined;
  return classe === undefined ? valeur : plainToInstance(classe, valeur);
}

@ApiExtraModels(...MODELES_DE_PRODUCTION)
export class SubmitProductionRequestDto {
  @ApiProperty({
    description:
      'Identifiant de la question de production, egal a celui du plan',
    example: 'b2-01-a4-feuille-canaux',
  })
  @TexteBorne(1, LONGUEUR_MAX_IDENTIFIANT)
  questionId: string;

  @ApiProperty({
    description:
      'Production brute du poste, corrigee cote serveur contre le plan',
    oneOf: SCHEMAS_DE_PRODUCTION,
  })
  @Transform(({ value }: { value: unknown }) => versProduction(value))
  @IsObject()
  @ValidateNested()
  valeur: ValeurProduction;

  @DureeDeReponse(600000)
  dureeMs: number;
}
