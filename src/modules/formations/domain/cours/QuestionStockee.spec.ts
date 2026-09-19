import {
  buildNumeriqueStockee,
  buildOptionStockee,
  buildVoteStocke,
} from '../../../../../test/factories/questions-stockees.factory';
import { creerRng, creerTirage } from './Aleatoire';
import {
  numeriqueStockee,
  questionDeNumerique,
  questionDeVote,
  slugOption,
  voteStocke,
} from './QuestionStockee';

const TIRAGE = creerTirage(creerRng(3));

describe('slugOption', () => {
  it.each([
    ['+25 %', 'plus-25-pct-ecd953a1'],
    [
      'Inférieur de 1 % au prix de départ',
      'inferieur-de-1-pct-au-prix-de-depart-7b7f8a6e',
    ],
  ])('rend l identifiant stable du § 9.2 pour « %s »', (libelle, attendu) => {
    expect(slugOption(libelle)).toBe(attendu);
  });

  it('traduit le moins typographique et l euro, retire les accents et garde quarante caracteres sans tiret final', () => {
    const identifiant = slugOption(
      '−30 960 € : écart de marge entre deux années très différentes',
    );

    expect(identifiant).toMatch(
      /^moins-30-960-eur-ecart-de-marge-entre-de-[0-9a-f]{8}$/,
    );
    expect(slugOption(`${'a'.repeat(39)} b`)).toMatch(
      new RegExp(`^${'a'.repeat(39)}-[0-9a-f]{8}$`),
    );
  });

  it('distingue deux libelles qui ne different que par la casse ou l accent', () => {
    expect(slugOption('Taux de marge')).not.toBe(slugOption('taux de marge'));
    expect(slugOption('marque')).not.toBe(slugOption('marqué'));
  });

  it('ne dit rien de la justesse de l option', () => {
    const vote = buildVoteStocke();
    const identifiants = vote.options.map((option) => option.id);

    expect(identifiants.join(' ')).not.toMatch(/bonne|juste|faux|piege/);
  });
});

describe('voteStocke', () => {
  it('accepte un vote stocke au format du § 9.3.2', () => {
    expect(voteStocke.safeParse(buildVoteStocke()).success).toBe(true);
  });

  it.each([
    [
      'aucune bonne option',
      buildVoteStocke({
        options: [
          buildOptionStockee('A', 'base-arrivee'),
          buildOptionStockee('B', 'base-inversee'),
        ],
      }),
    ],
    [
      'deux bonnes options',
      buildVoteStocke({
        options: [buildOptionStockee('A', null), buildOptionStockee('B', null)],
      }),
    ],
    [
      'deux options au meme identifiant',
      buildVoteStocke({
        options: [
          buildOptionStockee('A', null),
          { ...buildOptionStockee('B', 'base-arrivee'), id: slugOption('A') },
        ],
      }),
    ],
    [
      'une seule option',
      buildVoteStocke({ options: [buildOptionStockee('A', null)] }),
    ],
    [
      'un identifiant de plus de soixante caracteres',
      buildVoteStocke({ id: 'q'.repeat(61) }),
    ],
    [
      'une confusion inconnue',
      {
        ...buildVoteStocke(),
        options: [
          buildOptionStockee('A', null),
          { id: 'b', libelle: 'B', confusion: 'inconnue' },
        ],
      },
    ],
    ['une cle inconnue', { ...buildVoteStocke(), solution: 'o1' }],
    [
      'une cle inconnue dans une option',
      {
        ...buildVoteStocke(),
        options: [
          { ...buildOptionStockee('A', null), correcte: true },
          buildOptionStockee('B', 'base-arrivee'),
        ],
      },
    ],
  ])('refuse %s', (_cas, vote) => {
    expect(voteStocke.safeParse(vote).success).toBe(false);
  });
});

describe('numeriqueStockee', () => {
  it('accepte une question numerique stockee au format du § 9.3.2', () => {
    expect(numeriqueStockee.safeParse(buildNumeriqueStockee()).success).toBe(
      true,
    );
  });

  it.each([
    ['sans piege', { ...buildNumeriqueStockee(), pieges: [] }],
    ['sans forme publiee', { ...buildNumeriqueStockee(), formePubliee: '' }],
    ['a la solution infinie', buildNumeriqueStockee({ solution: Infinity })],
    ['avec une cle inconnue', { ...buildNumeriqueStockee(), graine: 1 }],
  ])('refuse une question %s', (_cas, question) => {
    expect(numeriqueStockee.safeParse(question).success).toBe(false);
  });
});

describe('questionDeVote', () => {
  it('convertit le vote stocke en question aux donnees constantes et aux identifiants stables', () => {
    const vote = buildVoteStocke({ segments: ['+25 %'] });
    const question = questionDeVote(vote);

    expect(question).toMatchObject({
      id: vote.id,
      type: 'vote',
      concept: 'taux-evolution',
      noteCompte: true,
      confusions: [
        'base-arrivee',
        'ecart-absolu-au-lieu-du-taux',
        'coefficient-confondu-avec-taux',
      ],
      segments: ['+25 %'],
    });
    expect(question.generer(TIRAGE)).toEqual({
      type: 'vote',
      enonce: vote.enonce,
      bonne: slugOption('+25 %'),
      bonneLibelle: '+25 %',
      pieges: [
        {
          confusion: 'base-arrivee',
          libelle: '+20 %',
          optionId: slugOption('+20 %'),
        },
        {
          confusion: 'ecart-absolu-au-lieu-du-taux',
          libelle: '+20 €',
          optionId: slugOption('+20 €'),
        },
        {
          confusion: 'coefficient-confondu-avec-taux',
          libelle: '+125 %',
          optionId: slugOption('+125 %'),
        },
      ],
    });
    expect(question.generer(creerTirage(creerRng(99)))).toEqual(
      question.generer(TIRAGE),
    );
  });
});

describe('questionDeNumerique', () => {
  it('convertit la question numerique stockee en question aux donnees constantes', () => {
    const stockee = buildNumeriqueStockee();
    const question = questionDeNumerique(stockee);

    expect(question).toMatchObject({
      id: stockee.id,
      type: 'numeric',
      concept: 'proportion',
      noteCompte: true,
      tolerance: { type: 'absolue', valeur: 0.05 },
      confusions: ['taux-valeur-facteur-cent', 'base-inversee'],
      formePubliee: '45,5',
    });
    expect(question.generer(TIRAGE)).toEqual({
      type: 'numeric',
      enonce: stockee.enonce,
      unite: '%',
      solution: 45.478261,
      pieges: [
        { confusion: 'taux-valeur-facteur-cent', valeur: 0.454783 },
        { confusion: 'base-inversee', valeur: 219.885277 },
      ],
    });
  });
});
