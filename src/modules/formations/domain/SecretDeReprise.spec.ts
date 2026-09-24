import { SecretDeReprise } from './SecretDeReprise';

describe('SecretDeReprise', () => {
  it('tire un secret de 256 bits en base64url, différent à chaque jonction', () => {
    const premier = SecretDeReprise.generer();
    const second = SecretDeReprise.generer();

    expect(premier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second).not.toBe(premier);
  });

  it('ne stocke que l empreinte du secret, jamais le secret lui-même', () => {
    const secret = SecretDeReprise.generer();
    const empreinte = SecretDeReprise.empreinte(secret);

    expect(empreinte).toMatch(/^[0-9a-f]{64}$/);
    expect(empreinte).not.toContain(secret);
    expect(SecretDeReprise.empreinte(secret)).toBe(empreinte);
  });

  it('rend la place au poste qui présente le secret remis à sa jonction', () => {
    const secret = SecretDeReprise.generer();

    expect(
      SecretDeReprise.autorise(SecretDeReprise.empreinte(secret), secret),
    ).toBe(true);
  });

  it.each([
    ['sans secret', undefined],
    ['avec un secret vide', ''],
    ['avec le secret d un autre poste', SecretDeReprise.generer()],
  ])(
    'refuse la place d un inscrit au poste qui se présente %s',
    (_, secret) => {
      const empreinte = SecretDeReprise.empreinte(SecretDeReprise.generer());

      expect(SecretDeReprise.autorise(empreinte, secret)).toBe(false);
    },
  );

  it('rend la place libérée par le formateur au premier poste qui la réclame', () => {
    expect(SecretDeReprise.autorise(null, undefined)).toBe(true);
  });
});
