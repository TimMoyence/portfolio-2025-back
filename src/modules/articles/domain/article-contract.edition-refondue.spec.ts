import { validArticleIngestEnvelope } from '../../../../test/factories/article-ingest.factory';
import { accepteeParLeSchemaPartage } from '../../../../test/helpers/depot/schema-d-ingestion-partage';
import { schemasDesModeles } from '../../../../test/helpers/http/saisies-validees';
import { PublishedArticleResponseDto } from '../interfaces/dto/article.response.dto';
import { ArticleContract } from './article-contract';

const SOURCE = {
  entity: '',
  text: 'Des mots de passe ont fuité sur GitHub.',
  source: 'Apiiro',
  url: 'https://ex.org/apiiro',
};

function edition(info: Record<string, unknown> = {}): unknown {
  const enveloppe = structuredClone(validArticleIngestEnvelope);
  const article: { sections: unknown } = enveloppe.article;
  article.sections = [
    {
      id: 'brief',
      kind: 'brief',
      title: 'Le brief en 30 s',
      intro: '',
      body: '',
      items: [
        {
          ...SOURCE,
          figure: '23 points',
          text: "d'écart en reformulant la consigne",
        },
        SOURCE,
      ],
    },
    {
      id: 'infos',
      kind: 'infos',
      title: 'Les infos du jour',
      intro: '',
      body: '',
      items: [
        {
          ...SOURCE,
          title: 'Claude Code laisse fuiter des secrets',
          for_business: 'Vos équipes vérifient leurs dépôts publics.',
          under_the_hood: 'Le fichier settings.local.json garde les commandes.',
          audience: 'dirigeants',
          horizon: 'trimestre',
          episode: 3,
          recap: 'Claude Code range ses réglages en clair.',
          rubric: 'outils-ia',
          ...info,
        },
      ],
    },
  ];
  return enveloppe;
}

function accepteeDesDeuxCotes(enveloppe: unknown): [boolean, boolean] {
  return [
    ArticleContract.safeParse(enveloppe).success,
    accepteeParLeSchemaPartage(enveloppe),
  ];
}

describe("Contrat d'ingestion — édition refondue", () => {
  it('MB-17 · le site accepte le brief en 30 s et les infos à deux niveaux, au contrat comme au schéma partagé', () => {
    expect(accepteeDesDeuxCotes(edition())).toEqual([true, true]);
  });

  it.each([
    { audience: 'investisseurs' },
    { horizon: 'demain' },
    { episode: 1 },
  ])('MB-05 · MB-06 · refuse des deux côtés %o', (hors_liste) => {
    expect(accepteeDesDeuxCotes(edition(hors_liste))).toEqual([false, false]);
  });

  it('MB-17 · la réponse publique expose le brief, les infos et leurs champs', async () => {
    const schemas = await schemasDesModeles([PublishedArticleResponseDto]);
    const parModele = Object.fromEntries(
      [...schemas.values()].flatMap((parNom) => Object.entries(parNom)),
    );

    expect(
      new Set(
        Object.keys(
          parModele['ArticleSectionItemResponseDto']?.properties ?? {},
        ),
      ),
    ).toEqual(
      new Set([
        'audience',
        'entity',
        'episode',
        'figure',
        'for_business',
        'horizon',
        'published_at',
        'recap',
        'retrieved_at',
        'rubric',
        'source',
        'text',
        'title',
        'under_the_hood',
        'url',
      ]),
    );
  });
});
