import {
  ESPACE_FINE_INSECABLE as FINE,
  ESPACE_INSECABLE as INSECABLE,
} from '../../../../common/domain/texte/sans-espaces-typographiques';
import {
  sansTypographie,
  typographier,
  typographierEnProfondeur,
} from './Typographie';

describe('sansTypographie', () => {
  it('laisse le signe moins, dont dépend l identifiant d une option', () => {
    expect(sansTypographie(`−5${INSECABLE}% au 2ᵉ`)).toBe('−5 % au 2e');
  });

  it('ramène l espace fine des milliers à l espace ordinaire, pour que l identifiant d une option ne change pas', () => {
    expect(sansTypographie(`41${FINE}000${INSECABLE}€`)).toBe('41 000 €');
  });
});

describe('typographier', () => {
  it.each([
    ['1 200 k€', `1${FINE}200${INSECABLE}k€`],
    ['110 000 € sur 10 ans', `110${FINE}000${INSECABLE}€ sur 10 ans`],
    ['1 250 000 habitants', `1${FINE}250${FINE}000 habitants`],
    [`12${INSECABLE}500 €`, `12${FINE}500${INSECABLE}€`],
    ['une hausse de 6 % par an', `une hausse de 6${INSECABLE}% par an`],
    ['826 k€ puis 44 M€', `826${INSECABLE}k€ puis 44${INSECABLE}M€`],
    ['9 500 kWh', `9${FINE}500${INSECABLE}kWh`],
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
    [
      '=C2*(1+$G$1), recopiée : 41 000 € au 1er janvier 2027.',
      `=C2*(1+$G$1), recopiée${INSECABLE}: 41${FINE}000${INSECABLE}€ au 1ᵉʳ janvier 2027.`,
    ],
    [
      '=SOMME(C3:C6) : environ 1 854,81 € d’intérêts.',
      `=SOMME(C3:C6)${INSECABLE}: environ 1${FINE}854,81${INSECABLE}€ d’intérêts.`,
    ],
    [
      '=SI(OU(D2>=5000;C2<>"France");"Visa";"Non") : F209 (4 950 €) ne l’est pas.',
      `=SI(OU(D2>=5000;C2<>"France");"Visa";"Non")${INSECABLE}: F209 (4${FINE}950${INSECABLE}€) ne l’est pas.`,
    ],
    [
      '=B3/B2-1, recopiée : environ 6,18 % chaque mois.',
      `=B3/B2-1, recopiée${INSECABLE}: environ 6,18${INSECABLE}% chaque mois.`,
    ],
  ])(
    'lie la prose qui suit la formule d une explication « %s », sans toucher la formule',
    (brut, attendu) => {
      expect(typographier(brut)).toBe(attendu);
    },
  );

  it.each([
    'En 2025 120 clients ont commandé',
    'un rang de 3 heures',
    '=SI(B2>=1200 ; "oui" ; "non")',
    '  =SI(B2>=1200 ; "oui" ; "non")',
    '=COEFFICIENT.CORRELATION(plage des x;plage des y)',
    '=A1&" : total ; 1 200 €"',
    '=SI(ET(F2="Impayée";E2>60);"À relancer";"")',
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

  it.each([
    [
      'le ca_ht saisi comme le texte « 1 150,00 € ».',
      `le ca_ht saisi comme le texte «${INSECABLE}1 150,00 €${INSECABLE}».`,
    ],
    [
      'Quelle formule convertit « 1 150,00 € » en 1 150 € ?',
      `Quelle formule convertit «${INSECABLE}1 150,00 €${INSECABLE}» en 1${FINE}150${INSECABLE}€${INSECABLE}?`,
    ],
    [
      '=CNUM(L2) : « 1 150,00 € » devient 1 150.',
      `=CNUM(L2)${INSECABLE}: «${INSECABLE}1 150,00 €${INSECABLE}» devient 1${FINE}150.`,
    ],
  ])(
    'garde la citation littérale d une cellule telle que le classeur l écrit, et lie la prose autour : « %s »',
    (brut, attendu) => {
      expect(typographier(brut, ['1 150,00 €'])).toBe(attendu);
    },
  );
});

describe('typographierEnProfondeur', () => {
  it('lie les textes imbriqués sans toucher aux clés ni aux autres valeurs', () => {
    const contenu = {
      'cle : brute': 'Seuil : 1 200 k€',
      valeurs: [6, true, null, '6 %'],
      cellules: { B2: '=A2*1,06', A1: 'CA (k€) :' },
    };

    expect(typographierEnProfondeur(contenu)).toEqual({
      'cle : brute': `Seuil${INSECABLE}: 1${FINE}200${INSECABLE}k€`,
      valeurs: [6, true, null, `6${INSECABLE}%`],
      cellules: { B2: '=A2*1,06', A1: `CA (k€)${INSECABLE}:` },
    });
  });

  it('porte les citations littérales jusqu aux textes imbriqués', () => {
    const contenu = { ecrans: [{ libelle: 'En texte : 1 150,00 €' }] };

    expect(typographierEnProfondeur(contenu, ['1 150,00 €'])).toEqual({
      ecrans: [{ libelle: `En texte${INSECABLE}: 1 150,00 €` }],
    });
  });
});
