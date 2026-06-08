import { escapeHtml } from './html-escape.util';

describe('escapeHtml', () => {
  it('echappe tous les caracteres HTML sensibles', () => {
    expect(escapeHtml('<a href="x">&\'')).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&#39;',
    );
  });

  it('echappe `&` en premier (pas de double echappement des entites)', () => {
    // Si `&` n'etait pas echappe en premier, `<` deviendrait `&amp;lt;`.
    expect(escapeHtml('<')).toBe('&lt;');
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('ne throw pas sur null et coerce via String()', () => {
    expect(() => escapeHtml(null)).not.toThrow();
    expect(escapeHtml(null)).toBe('null');
    expect(escapeHtml(undefined)).toBe('undefined');
    expect(escapeHtml(42)).toBe('42');
  });
});
