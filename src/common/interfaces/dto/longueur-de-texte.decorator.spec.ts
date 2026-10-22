import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  chargerLesSaisies,
  classeDe,
  type Contrainte,
  type Modele,
  MODULES,
  SAISIES,
  schemasDesModeles,
  SOURCES,
  valideLaContrainte,
} from '../../../../test/helpers/saisies-validees';
import { saisieRetenue } from '../../../../test/helpers/validation-pipe';
import { requireText } from '../../domain/validation/domain-validators';
import {
  AuMoinsCaracteres,
  AuPlusCaracteres,
  TexteSaisi,
} from './longueur-de-texte.decorator';

const EMOJI = String.fromCodePoint(0x1f600);
const SELECTEUR_EMOJI = String.fromCodePoint(0xfe0f);

class TexteTemoin {
  @TexteSaisi(2, 5)
  texte: string;
}

class SecretTemoin {
  @AuMoinsCaracteres(3)
  @AuPlusCaracteres(5)
  secret: string;
}

const gardeParLeDomaine = (texte: string): string | null => {
  try {
    return requireText(texte, 'texte', 2, 5);
  } catch {
    return null;
  }
};

describe('TexteSaisi', () => {
  it('retient a la saisie exactement le texte que le domaine garde', () => {
    const saisie = fc
      .array(fc.constantFrom(' ', '\t', 'a', 'é', EMOJI, SELECTEUR_EMOJI), {
        maxLength: 9,
      })
      .map((morceaux) => morceaux.join(''));

    fc.assert(
      fc.property(saisie, (texte) => {
        expect(saisieRetenue(TexteTemoin, { texte })?.texte ?? null).toBe(
          gardeParLeDomaine(texte),
        );
      }),
    );
  });
});

describe('AuMoinsCaracteres et AuPlusCaracteres', () => {
  it.each([
    ['5 emoji', EMOJI.repeat(5), true],
    [
      '3 lettres suivies chacune d un selecteur',
      `a${SELECTEUR_EMOJI}`.repeat(3),
      false,
    ],
    ['6 espaces, sans rognage', ' '.repeat(6), false],
    ['3 espaces, sans rognage', ' '.repeat(3), true],
  ])(
    'comptent %s en points de code, comme une colonne varchar',
    (_cas, secret, accepte) => {
      expect(saisieRetenue(SecretTemoin, { secret }) !== null).toBe(accepte);
    },
  );
});

const BORNE_DE_CLASS_VALIDATOR =
  /import\s*\{[^}]*\b(?:MinLength|MaxLength|Length)\b[^}]*\}\s*from\s*'class-validator'/;

const BORNES = chargerLesSaisies().contraintes.filter(
  ({ name }) => name === 'minLength' || name === 'maxLength',
);

const libelleDe = (borne: Contrainte): string =>
  `${classeDe(borne)}.${borne.propertyName} ${String(borne.name)} ${String(borne.constraints[0])}`;

const pointsDeCode = (nombre: number): string =>
  Array.from({ length: nombre }, (_, rang) =>
    rang % 2 === 0 ? EMOJI : SELECTEUR_EMOJI,
  ).join('');

const modeleDe = ({ target }: Contrainte): Modele | undefined =>
  typeof target === 'function' ? target : undefined;

describe('bornes de longueur des saisies', () => {
  it('couvrent les interfaces de chaque module, formations comprises', () => {
    expect(SAISIES).toEqual(
      expect.arrayContaining([
        join(MODULES, 'users/interfaces/dto/regles-de-saisie.ts'),
        join(MODULES, 'formations/interfaces/dto/join-session.request.dto.ts'),
        join(
          MODULES,
          'formations/interfaces/dto/contrat/tenter-enigme.request.dto.ts',
        ),
      ]),
    );
    expect(BORNES.map(libelleDe)).toEqual(
      expect.arrayContaining([
        'ContactRequestDto.firstName maxLength 50',
        'JoinSessionRequestDto.prenom maxLength 80',
        'RequestToolkitRequestDto.firstName maxLength 50',
      ]),
    );
  });

  it('ne passent par aucune borne de class-validator', () => {
    expect(
      SAISIES.filter((fichier) =>
        BORNE_DE_CLASS_VALIDATOR.test(readFileSync(fichier, 'utf8')),
      ).map((fichier) => fichier.slice(SOURCES.length + 1)),
    ).toEqual([]);
  });

  it.each(BORNES.map((borne) => [libelleDe(borne), borne] as const))(
    '%s : compte en points de code comme la colonne, la borne exacte acceptée, un de plus refusé',
    (_libelle, borne) => {
      const limite = Number(borne.constraints[0]);
      const auDela = borne.name === 'maxLength' ? limite + 1 : limite - 1;

      expect(valideLaContrainte(borne, pointsDeCode(limite))).toBe(true);
      expect(valideLaContrainte(borne, pointsDeCode(auDela))).toBe(false);
    },
  );

  it('annoncent au contrat OpenAPI chaque borne qu elles valident', async () => {
    const schemas = await schemasDesModeles([
      ...new Set(BORNES.flatMap((borne) => modeleDe(borne) ?? [])),
    ]);

    expect(
      BORNES.flatMap((borne) => {
        const modele = modeleDe(borne);
        const propriete = (modele && schemas.get(modele))?.[classeDe(borne)]
          ?.properties?.[borne.propertyName];
        const annonce = (borne.each ? propriete?.items : propriete)?.[
          String(borne.name)
        ];
        return annonce === borne.constraints[0]
          ? []
          : [`${libelleDe(borne)} annoncé ${String(annonce)}`];
      }),
    ).toEqual([]);
  });
});
