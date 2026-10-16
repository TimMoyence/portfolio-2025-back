import { boiteDeLivraison } from './boite-de-livraison';

describe('boiteDeLivraison', () => {
  it.each([
    ['lea@exemple.fr', 'lea@exemple.fr'],
    ['Lea.Martin@Exemple.FR', 'lea.martin@exemple.fr'],
    ['lea+newsletter@exemple.fr', 'lea@exemple.fr'],
    ['lea+a+b@exemple.fr', 'lea@exemple.fr'],
    ['l.ea.m@gmail.com', 'leam@gmail.com'],
    ['L.Ea+promo@GMAIL.com', 'lea@gmail.com'],
    ['lea@googlemail.com', 'lea@gmail.com'],
    ['l.ea+1@googlemail.com', 'lea@gmail.com'],
    ['+lea@exemple.fr', '+lea@exemple.fr'],
    ['l.ea@sous.gmail.com', 'l.ea@sous.gmail.com'],
    ['+33612345678', '+33612345678'],
    ['"lea"@exemple.fr', 'lea@exemple.fr'],
    ['"L.ea+relance"@gmail.com', 'lea@gmail.com'],
    ['"l\\ea"@exemple.fr', 'lea@exemple.fr'],
    ['"lea@x+1"@exemple.fr', 'lea@x@exemple.fr'],
    ['"l.ea@x"@googlemail.com', 'lea@x@gmail.com'],
    ['lea@ｇｍａｉｌ.com', 'lea@gmail.com'],
    ['l.ea@ＥＸＥＭＰＬＥ.ＦＲ', 'l.ea@exemple.fr'],
    ['lea@exämple.fr', 'lea@xn--exmple-cua.fr'],
    ['lea@XN--EXMPLE-CUA.fr', 'lea@xn--exmple-cua.fr'],
  ])('replie %s sur la boite %s', (adresse, boite) => {
    expect(boiteDeLivraison(adresse)).toBe(boite);
  });

  it('garde les points hors de Gmail', () => {
    expect(boiteDeLivraison('l.ea@exemple.fr')).not.toBe(
      boiteDeLivraison('lea@exemple.fr'),
    );
  });
});
