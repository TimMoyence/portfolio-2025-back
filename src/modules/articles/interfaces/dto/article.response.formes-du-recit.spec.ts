import { schemasDeLArticleServi } from '../../../../../test/helpers/http/schemas-de-l-article-servi';
import {
  APartCaDto,
  ATesterDto,
  BarreDuRecitDto,
  BreveDto,
  ChiffreDto,
  CitationDto,
  DecodeurDto,
  EditoDto,
  FeuilletonDuRecitDto,
  GraphiqueDuRecitDto,
  HistoireDuShotDto,
  ImageDuRecitDto,
  ShotDto,
  SortieDto,
  SortiesDto,
  SourceDuRecitDto,
  SujetDuJourDto,
} from './article.response.dto';

describe('MB-19 · chaque forme du récit servie décrit ses champs, requis et nullables', () => {
  const schemas = schemasDeLArticleServi();

  it.each([
    [SourceDuRecitDto, ['nom', 'url', 'publie_le'], ['publie_le']],
    [ImageDuRecitDto, ['url', 'credit'], []],
    [FeuilletonDuRecitDto, ['date', 'rappel'], []],
    [BarreDuRecitDto, ['libelle', 'valeur', 'affichage'], []],
    [GraphiqueDuRecitDto, ['titre', 'unite', 'barres'], []],
    [EditoDto, ['kind', 'texte', 'signature'], []],
    [
      SujetDuJourDto,
      [
        'kind',
        'titre',
        'accroche',
        'pourquoi',
        'contexte',
        'faits',
        'et_maintenant',
        'bref',
        'source',
        'image',
        'graphique',
        'feuilleton',
      ],
      ['image', 'graphique', 'feuilleton'],
    ],
    [
      HistoireDuShotDto,
      ['accroche', 'texte', 'rubrique', 'source', 'image', 'feuilleton'],
      ['rubrique', 'image', 'feuilleton'],
    ],
    [ShotDto, ['kind', 'histoires'], []],
    [DecodeurDto, ['kind', 'terme', 'explication'], []],
    [ATesterDto, ['kind', 'nom', 'texte', 'source'], []],
    [SortieDto, ['produit', 'version', 'changement', 'source'], []],
    [SortiesDto, ['kind', 'lignes'], []],
    [ChiffreDto, ['kind', 'valeur', 'texte', 'source'], []],
    [
      CitationDto,
      ['kind', 'texte', 'auteur', 'traduite_de', 'contexte', 'source'],
      ['traduite_de'],
    ],
    [BreveDto, ['texte', 'source'], []],
    [APartCaDto, ['kind', 'breves'], []],
  ] as const)(
    'MB-19 · %p sert exactement ses champs',
    (modele, requis, nullables) => {
      const schema = schemas()[modele.name];
      const parNom = (a: string, b: string) => a.localeCompare(b);
      expect((schema?.required ?? []).toSorted(parNom)).toEqual(
        [...requis].toSorted(parNom),
      );
      const nuls = Object.entries(schema?.properties ?? {})
        .filter(([, propriete]) => propriete.nullable === true)
        .map(([nom]) => nom);
      expect(nuls.toSorted(parNom)).toEqual([...nullables].toSorted(parNom));
    },
  );
});
