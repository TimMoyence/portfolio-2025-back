import { type ArgumentMetadata, BadRequestException } from '@nestjs/common';
import {
  MESSAGE_D_OCTET_NUL,
  RefusDeLOctetNulPipe,
} from './refus-de-l-octet-nul.pipe';

const pipe = new RefusDeLOctetNulPipe();
const NUL = '\u0000';

function transformer(
  valeur: unknown,
  type: ArgumentMetadata['type'] = 'body',
): unknown {
  return pipe.transform(valeur, { type });
}

function attendreRefus(valeur: unknown, type?: ArgumentMetadata['type']) {
  expect(() => transformer(valeur, type)).toThrow(
    new BadRequestException(MESSAGE_D_OCTET_NUL),
  );
}

function imbriquer(feuille: unknown, profondeur: number): unknown {
  let valeur = feuille;
  for (let rang = 0; rang < profondeur; rang += 1) {
    valeur = rang % 2 === 0 ? [valeur] : { niveau: valeur };
  }
  return valeur;
}

describe('RefusDeLOctetNulPipe', () => {
  it.each(['body', 'query', 'param'] as const)(
    'refuse en 400 une saisie %s qui porte un octet nul',
    (type) => {
      attendreRefus(`Th${NUL}eo`, type);
    },
  );

  it('refuse un octet nul a toute profondeur du corps, dans une valeur ou dans une cle', () => {
    attendreRefus({ identite: { prenom: 'Theo', nom: `Mar${NUL}tin` } });
    attendreRefus({ reponses: ['a', ['b', `c${NUL}`]] });
    attendreRefus({ donnees: { [`cle${NUL}`]: 'valeur' } });
  });

  it('refuse un octet nul enfoui sous dix mille niveaux sans epuiser la pile', () => {
    attendreRefus(imbriquer(`fin${NUL}`, 10_000));
  });

  it('rend la saisie telle quelle quand aucun octet nul ne s y trouve', () => {
    const saisie = {
      prenom: 'Théo ❤️',
      nombres: [0, 1.5, -2],
      vrai: true,
      rien: null,
      echappe: '\\u0000 ecrit en toutes lettres',
    };

    expect(transformer(saisie)).toBe(saisie);
    expect(transformer(imbriquer('fin', 10_000))).toBeDefined();
  });

  it('laisse aux decorateurs propres leurs valeurs, qui ne viennent pas de la saisie', () => {
    const identite = { prenom: `Th${NUL}eo` };

    expect(transformer(identite, 'custom')).toBe(identite);
  });
});
