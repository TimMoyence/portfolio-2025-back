import { PRESENTATIONS_VISUELLES_VALIDES } from '../../../../test/factories/formations/cours/presentation-visuelle.factory';
import { parseVisualPresentation } from '../../../modules/formations/domain/cours/structure/VisualPresentation';
import { lienHttp, lienHttps } from './lien-web';

describe('Un lien web : http(s) seulement, sans espace, 2 048 caractères au plus', () => {
  it.each([
    ['javascript:', 'javascript:alert(1)'],
    ['data:', 'data:text/html,<script>x</script>'],
    ['mailto:', 'mailto:a@b.fr'],
    ['le protocole en capitales', 'HTTPS://a.test/x'],
    ['une espace', 'https://a.test/a b'],
    ['plus de 2 048 caractères', `https://a.test/${'a'.repeat(2048)}`],
    ['le vide', ''],
  ])('refuse %s', (_cas, lien) => {
    expect(lienHttp.safeParse(lien).success).toBe(false);
  });

  it('accepte un lien http ou https propre', () => {
    expect(lienHttp.safeParse('http://a.test/x?y=1').success).toBe(true);
    expect(lienHttp.safeParse('https://a.test/x').success).toBe(true);
  });

  it('en https seulement, refuse le http', () => {
    expect(lienHttps.safeParse('http://a.test/x').success).toBe(false);
    expect(lienHttps.safeParse('https://a.test/x').success).toBe(true);
  });

  it.each(['javascript:alert(1)', 'data:text/html,x'])(
    'un lien source de formation refuse %s, comme celui d un article',
    (href) => {
      expect(() =>
        parseVisualPresentation({
          renderer: 'image-right',
          props: {
            ...PRESENTATIONS_VISUELLES_VALIDES['image-right'],
            sourceLink: { href, label: 'Source' },
          },
        }),
      ).toThrow();
    },
  );
});
