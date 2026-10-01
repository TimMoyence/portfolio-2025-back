import {
  ESPACE_INSECABLE as INSECABLE,
  typographier,
  typographierEnProfondeur,
} from './Typographie';

describe('typographier', () => {
  it.each([
    ['1 200 k€', `1${INSECABLE}200${INSECABLE}k€`],
    ['110 000 € sur 10 ans', `110${INSECABLE}000${INSECABLE}€ sur 10 ans`],
    ['1 250 000 habitants', `1${INSECABLE}250${INSECABLE}000 habitants`],
    ['une hausse de 6 % par an', `une hausse de 6${INSECABLE}% par an`],
    ['826 k€ puis 44 M€', `826${INSECABLE}k€ puis 44${INSECABLE}M€`],
    ['9 500 kWh', `9${INSECABLE}500${INSECABLE}kWh`],
    ['Que vaut u₅ ?', `Que vaut u₅${INSECABLE}?`],
    ['À retenir : la raison', `À retenir${INSECABLE}: la raison`],
    ['Vrai ; faux !', `Vrai${INSECABLE}; faux${INSECABLE}!`],
    ['« Tant que »', `«${INSECABLE}Tant que${INSECABLE}»`],
    ['1er passage', '1ᵉʳ passage'],
    ['la 1re année, puis la 2e', 'la 1ʳᵉ année, puis la 2ᵉ'],
    ['entre le 1er et le 4e trimestre.', 'entre le 1ᵉʳ et le 4ᵉ trimestre.'],
    ['le 10e terme', 'le 10ᵉ terme'],
  ])('lie « %s »', (brut, attendu) => {
    expect(typographier(brut)).toBe(attendu);
  });

  it.each([
    'En 2025 120 clients ont commandé',
    'un rang de 3 heures',
    '=SI(B2>=1200 ; "oui" ; "non")',
    'suite-arithmetique',
    'b2-04-a2e-exercice',
    'ecran-2e-partie',
    '/assets/cours/2e/figure.webp',
    'La 3ᵉ valeur',
    'V(x) = 400e^(0,06x)',
    'f(x) = 20e^(−0,7x)',
    'avec 50e(0,2x) mal écrit',
    'Rien à lier ici.',
  ])('laisse « %s » intact', (brut) => {
    expect(typographier(brut)).toBe(brut);
  });

  it('est idempotent', () => {
    const lie = typographier('1 200 k€ : seuil atteint ?');
    expect(typographier(lie)).toBe(lie);
  });
});

describe('typographierEnProfondeur', () => {
  it('lie les textes imbriqués sans toucher aux clés ni aux autres valeurs', () => {
    const contenu = {
      'cle : brute': 'Seuil : 1 200 k€',
      valeurs: [6, true, null, '6 %'],
      cellules: { B2: '=A2*1,06', A1: 'CA (k€) :' },
    };

    expect(typographierEnProfondeur(contenu)).toEqual({
      'cle : brute': `Seuil${INSECABLE}: 1${INSECABLE}200${INSECABLE}k€`,
      valeurs: [6, true, null, `6${INSECABLE}%`],
      cellules: { B2: '=A2*1,06', A1: `CA (k€)${INSECABLE}:` },
    });
  });
});
