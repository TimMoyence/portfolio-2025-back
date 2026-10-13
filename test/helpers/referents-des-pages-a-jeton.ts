export const JETON_DE_PAGE = '6f0e3c1a-9b2d-4c8e-a1f7-3d5b9e2c4a10';

export const REFERENTS_DES_PAGES_A_JETON = [
  `https://asilidesign.fr/fr/verify-email?token=${JETON_DE_PAGE}`,
  `https://asilidesign.fr/verify-email?token=${JETON_DE_PAGE}`,
  `https://asilidesign.fr/en/reset-password?source=mail&token=${JETON_DE_PAGE}`,
  `https://asilidesign.fr/fr/formations/ia-solopreneurs/toolkit/${JETON_DE_PAGE}`,
  `https://asilidesign.fr/formations/ia-solopreneurs/toolkit/${JETON_DE_PAGE}?utm_source=mail`,
];

export const REFERENTS_SANS_JETON = [
  'https://asilidesign.fr/fr/contact',
  'https://asilidesign.fr/fr/formations/ia-solopreneurs/toolkit',
  'https://asilidesign.fr/fr/articles?tokenizer=1',
];
