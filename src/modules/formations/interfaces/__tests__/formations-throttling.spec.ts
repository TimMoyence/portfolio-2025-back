import {
  suivreParCodeDeSession,
  suivreParParticipant,
} from '../formations-throttling';

const IP_SALLE = 'sortie-nat-salle-b204';
const IP_VOISINE = 'sortie-nat-salle-b205';
const IP_DOMICILE = 'sortie-nat-domicile';
const JETON_A = '8f1c3b2a-5d4e-4f6a-9b8c-7d6e5f4a3b2c.empreinte';
const JETON_B = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d.empreinte';

function requete(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return { ip: IP_SALLE, params: {}, headers: {}, ...overrides };
}

describe('suivreParCodeDeSession', () => {
  it('separe deux seances qui partagent la meme adresse publique', () => {
    const premiere = suivreParCodeDeSession(
      requete({ params: { code: '4271' } }),
    );
    const seconde = suivreParCodeDeSession(
      requete({ params: { code: '8312' } }),
    );

    expect(premiere).not.toBe(seconde);
  });

  it('donne un seul compteur a toute une classe sur le meme code', () => {
    const poste = suivreParCodeDeSession(requete({ params: { code: '4271' } }));
    const autrePoste = suivreParCodeDeSession(
      requete({ ip: IP_VOISINE, params: { code: '4271' } }),
    );

    expect(poste).toBe(autrePoste);
  });

  it('retombe sur l adresse quand aucun code n est presente', () => {
    expect(suivreParCodeDeSession(requete())).toBe(`ip:${IP_SALLE}`);
  });
});

describe('suivreParParticipant', () => {
  it('donne un compteur par etudiant, pas par salle', () => {
    const theo = suivreParParticipant(
      requete({ headers: { 'x-participant-token': JETON_A } }),
    );
    const lea = suivreParParticipant(
      requete({ headers: { 'x-participant-token': JETON_B } }),
    );

    expect(theo).not.toBe(lea);
    expect(theo).not.toContain(IP_SALLE);
  });

  it('reconnait le meme etudiant a travers ses requetes', () => {
    const premiere = suivreParParticipant(
      requete({ headers: { 'x-participant-token': JETON_A } }),
    );
    const seconde = suivreParParticipant(
      requete({
        ip: IP_DOMICILE,
        headers: { 'x-participant-token': JETON_A },
      }),
    );

    expect(premiere).toBe(seconde);
  });

  it('retombe sur l adresse quand le jeton est absent ou illisible', () => {
    expect(suivreParParticipant(requete())).toBe(`ip:${IP_SALLE}`);
    expect(
      suivreParParticipant(
        requete({ headers: { 'x-participant-token': '.sans-identifiant' } }),
      ),
    ).toBe(`ip:${IP_SALLE}`);
  });

  it('ne laisse pas une requete sans adresse echapper au comptage', () => {
    expect(suivreParParticipant({ params: {}, headers: {} })).toBe(
      'ip:inconnue',
    );
  });
});
