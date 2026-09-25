import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  Equals,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidateNested,
  ValidatorConstraint,
} from 'class-validator';
import type {
  ValidationArguments,
  ValidatorConstraintInterface,
} from 'class-validator';
import type { ValeurProduction } from '../../../domain/contrats/resultats';
import { DureeDeReponse } from '../duree-de-reponse.decorator';
import { entreesBornees } from '../objet-plat';

const LONGUEUR_MAX_IDENTIFIANT = 60;
const LONGUEUR_MAX_FORMULE = 200;
const ENTREES_MAX = 400;
const TYPES_DE_PRODUCTION = ['feuille', 'tableau', 'classement'] as const;

@ValidatorConstraint({ name: 'dictionnaireDeTextes', async: false })
class DictionnaireDeTextes implements ValidatorConstraintInterface {
  validate(valeur: unknown, args: ValidationArguments): boolean {
    const [longueurMax] = args.constraints as [number];
    return (
      entreesBornees(valeur, ENTREES_MAX)?.every(
        ([cle, texte]) =>
          cle.length > 0 &&
          cle.length <= LONGUEUR_MAX_IDENTIFIANT &&
          typeof texte === 'string' &&
          texte.length <= longueurMax,
      ) ?? false
    );
  }

  defaultMessage(args: ValidationArguments): string {
    const [longueurMax] = args.constraints as [number];
    return `${args.property} doit associer au plus ${ENTREES_MAX} identifiants a des textes de ${longueurMax} caracteres au plus`;
  }
}

class ProductionFeuilleDto {
  @ApiProperty({ enum: ['feuille'] })
  @Equals('feuille')
  type: 'feuille';

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string', maxLength: LONGUEUR_MAX_FORMULE },
    description: 'Saisie brute de chaque cellule, formule ou valeur',
    example: { B5: '=SOMME(B2:B4)', E2: '=C2/$C$5' },
  })
  @Validate(DictionnaireDeTextes, [LONGUEUR_MAX_FORMULE])
  cellules: Record<string, string>;
}

class SaisieTableauDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  rang: number;

  @ApiProperty({ example: 'prix' })
  @IsString()
  @Matches(/^[a-z][A-Za-z]*$/)
  @MaxLength(LONGUEUR_MAX_IDENTIFIANT)
  cle: string;

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
  @ArrayMaxSize(ENTREES_MAX)
  @ValidateNested({ each: true })
  @Type(() => SaisieTableauDto)
  saisies: SaisieTableauDto[];
}

class ProductionClassementDto {
  @ApiProperty({ enum: ['classement'] })
  @Equals('classement')
  type: 'classement';

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    description: 'Categorie choisie pour chaque carte',
    example: { 'carte-ca-2024-2025': 'comparable' },
  })
  @Validate(DictionnaireDeTextes, [LONGUEUR_MAX_IDENTIFIANT])
  classement: Record<string, string>;
}

class ProductionNeSaitPasDto {
  @ApiProperty({ enum: TYPES_DE_PRODUCTION })
  @IsIn(TYPES_DE_PRODUCTION)
  type: (typeof TYPES_DE_PRODUCTION)[number];

  @ApiProperty({ enum: [true] })
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
  if (typeof valeur !== 'object' || valeur === null || Array.isArray(valeur)) {
    return valeur;
  }
  const brute = valeur as Record<string, unknown>;
  if ('neSaitPas' in brute) {
    return plainToInstance(ProductionNeSaitPasDto, brute);
  }
  const classe =
    typeof brute.type === 'string' && Object.hasOwn(CLASSE_PAR_TYPE, brute.type)
      ? CLASSE_PAR_TYPE[brute.type]
      : undefined;
  return classe === undefined ? valeur : plainToInstance(classe, brute);
}

@ApiExtraModels(...MODELES_DE_PRODUCTION)
export class SubmitProductionRequestDto {
  @ApiProperty({
    description:
      'Identifiant de la question de production, egal a celui du plan',
    example: 'b2-01-a4-feuille-canaux',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(LONGUEUR_MAX_IDENTIFIANT)
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
