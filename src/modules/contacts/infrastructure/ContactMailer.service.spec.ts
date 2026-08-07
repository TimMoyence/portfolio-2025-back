import { ContactMailerService } from './ContactMailer.service';

class TestableContactMailerService extends ContactMailerService {
  public testEscapeHtml(input: string): string {
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
  });
});
