import { empreinteSha256 } from '../../../common/domain/crypto/empreintes';
import {
  ACCEPTEE_DES_DEUX_COTES,
  recitDuMatin,
  refuseeCommeParLeSchemaPartage,
  verdicts,
} from '../../../../test/helpers/depot/schema-d-ingestion-partage';

type Enveloppe = {
  article: {
    content_markdown: string;
    published_at: string;
    provenance: { content_sha256: string };
  };
};

const avecLeMarkdown = (markdown: string) => (e: Enveloppe) => {
  e.article.content_markdown = markdown;
  e.article.provenance.content_sha256 = empreinteSha256(markdown);
};

describe('MB-24 · Markdown et calendrier se lisent comme le schéma partagé', () => {
  refuseeCommeParLeSchemaPartage<Enveloppe>([
    [
      'un Markdown de 50 emoji, sous les 100 caractères',
      avecLeMarkdown('🚀'.repeat(50)),
    ],
    [
      'un 30 février',
      (e: Enveloppe) => (e.article.published_at = '2026-02-30T06:00:00Z'),
    ],
  ]);

  it('MB-24 · accepte un Markdown de 100 caractères avec emoji', () => {
    const juste = recitDuMatin(avecLeMarkdown('🚀' + 'a'.repeat(99)));
    expect(verdicts(juste)).toEqual(ACCEPTEE_DES_DEUX_COTES);
  });
});
