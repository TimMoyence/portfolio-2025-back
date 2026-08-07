import { safeHtml } from '../../../common/infrastructure/mail/html-escape.util';
import type { EscapedHtml } from '../../../common/infrastructure/mail/html-escape.util';
import { ContactMailerService } from './ContactMailer.service';

class TestableContactMailerService extends ContactMailerService {
  public testEscapeHtml(input: string): EscapedHtml {
    return this.escapeHtml(input);
  }
}

describe('ContactMailerService', () => {
  let service: TestableContactMailerService;

  beforeEach(() => {
    service = new TestableContactMailerService();
  });

  describe('escapeHtml', () => {
    it('devrait echapper correctement les caracteres HTML dangereux', () => {
      const input = '<script>alert("xss")</script>';
      const result = service.testEscapeHtml(input);

      expect(result).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
      );
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('devrait echapper les esperluettes et les apostrophes', () => {
      const input = "Tom & Jerry's <adventure>";
      const result = service.testEscapeHtml(input);

      expect(result).toBe('Tom &amp; Jerry&#39;s &lt;adventure&gt;');
    });

    it('devrait produire un fragment marque, interpolable sans re-echappement', () => {
      const fragment: EscapedHtml = service.testEscapeHtml('<b>');

      expect(safeHtml`<td>${fragment}</td>`).toBe('<td>&lt;b&gt;</td>');
    });

    it('devrait refuser a la compilation une chaine brute dans le gabarit', () => {
      const raw = '<script>alert(1)</script>';

      // @ts-expect-error une chaine brute n'est pas un fragment marque
      const rendered: string = safeHtml`<td>${raw}</td>`;

      expect(rendered).toContain('<script>');
    });
  });
});
