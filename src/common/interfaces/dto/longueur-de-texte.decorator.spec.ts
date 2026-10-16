import * as fc from 'fast-check';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { collectFiles } from '../../../../test/helpers/source-tree';
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

const SOURCES = join(__dirname, '../../..');
const MODULES = join(SOURCES, 'modules');
const sourcesDe = (dossier: string): string[] =>
  collectFiles(dossier).filter(
    (fichier) => fichier.endsWith('.ts') && !fichier.endsWith('.spec.ts'),
  );
const MODULES_QUI_ROGNENT = readdirSync(MODULES).filter((module) =>
  sourcesDe(join(MODULES, module, 'domain')).some((fichier) =>
    /\b(?:requireText|optionalText)\(/.test(readFileSync(fichier, 'utf8')),
  ),
);
const SAISIES = [
  join(SOURCES, 'common/interfaces'),
  ...MODULES_QUI_ROGNENT.map((module) => join(MODULES, module, 'interfaces')),
].flatMap(sourcesDe);
const BORNE_DE_CLASS_VALIDATOR =
  /import\s*\{[^}]*\b(?:MinLength|MaxLength|Length)\b[^}]*\}\s*from\s*'class-validator'/;

describe('bornes de longueur des saisies', () => {
  it('trouvent chaque module dont le domaine rogne ses textes', () => {
    expect(MODULES_QUI_ROGNENT).toEqual(
      expect.arrayContaining(['contacts', 'newsletter', 'users']),
    );
    expect(SAISIES).toContain(
      join(MODULES, 'users/interfaces/dto/regles-de-saisie.ts'),
    );
  });

  it('ne passent par aucune borne de class-validator dans ces modules', () => {
    expect(
      SAISIES.filter((fichier) =>
        BORNE_DE_CLASS_VALIDATOR.test(readFileSync(fichier, 'utf8')),
      ).map((fichier) => fichier.slice(SOURCES.length + 1)),
    ).toEqual([]);
  });
});
