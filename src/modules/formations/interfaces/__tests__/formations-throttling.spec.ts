import {
  FENETRE_THROTTLE_MS,
  LimiteParMinute,
  LimiteParParticipant,
  suivreParCodeDeSession,
  suivreParParticipant,
} from '../formations-throttling';
import { createMockParticipantsRepo } from '../../../../../test/factories/formation.factory';
import { installerVariables } from '../../../../../test/helpers/environnement';
import {
  limiteDeThrottle,
  methodeDe,
} from '../../../../../test/helpers/metadonnees-de-route';
import { ParticipantTokenService } from '../ParticipantToken.service';

const IP_SALLE = 'sortie-nat-salle-b204';
const IP_VOISINE = 'sortie-nat-salle-b205';
const IP_DOMICILE = 'sortie-nat-domicile';
const SECRET = 'secret-de-test-formations-assez-long-1234';
const SESSION_ID = '3f1c3b2a-5d4e-4f6a-9b8c-7d6e5f4a3b2c';
const AUTRE_SESSION = '4f1c3b2a-5d4e-4f6a-9b8c-7d6e5f4a3b2d';
const THEO = '8f1c3b2a-5d4e-4f6a-9b8c-7d6e5f4a3b2c';
const LEA = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';

class ControleurTemoin {
  @LimiteParParticipant(7)
  parParticipant(): void {}

  @LimiteParMinute(9)
  parMinute(): void {}
}

const limiteDe = (nom: keyof ControleurTemoin) =>
  limiteDeThrottle(methodeDe(ControleurTemoin, nom));

describe('LimiteParParticipant', () => {
  it('limite la route par minute et compte par participant', () => {
    expect(limiteDe('parParticipant')).toEqual({
      limite: 7,
      fenetre: FENETRE_THROTTLE_MS,
      suivi: suivreParParticipant,
    });
  });
});

describe('LimiteParMinute', () => {
  it('limite la route par minute en gardant le suivi par defaut', () => {
    expect(limiteDe('parMinute')).toEqual({
      limite: 9,
      fenetre: FENETRE_THROTTLE_MS,
      suivi: undefined,
    });
  });
});

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
  const tokens = new ParticipantTokenService(createMockParticipantsRepo());
  let jetonTheo: string;
  let jetonLea: string;

  installerVariables({ FORMATION_REVIEW_TOKEN_SECRET: SECRET });

  beforeAll(() => {
    jetonTheo = tokens.sign(SESSION_ID, THEO, 0);
    jetonLea = tokens.sign(SESSION_ID, LEA, 0);
  });

  function requeteDe(
    jeton: string,
    overrides: Record<string, unknown> = {},
  ): Record<string, unknown> {
    return requete({
      params: { id: SESSION_ID },
      headers: { 'x-participant-token': jeton },
      ...overrides,
    });
  }

  it('donne un compteur par etudiant, pas par salle', () => {
    const theo = suivreParParticipant(requeteDe(jetonTheo));
    const lea = suivreParParticipant(requeteDe(jetonLea));

    expect(theo).not.toBe(lea);
    expect(theo).not.toContain(IP_SALLE);
  });

  it('reconnait le meme etudiant a travers ses requetes', () => {
    const premiere = suivreParParticipant(requeteDe(jetonTheo));
    const seconde = suivreParParticipant(
      requeteDe(jetonTheo, { ip: IP_DOMICILE }),
    );

    expect(premiere).toBe(seconde);
  });

  it('S1 · ne laisse pas le jeton revoque d un poste libere epuiser le compteur de son nouveau titulaire', () => {
    const revoque = suivreParParticipant(requeteDe(jetonTheo));
    const courant = suivreParParticipant(
      requeteDe(tokens.sign(SESSION_ID, THEO, 1)),
    );

    expect(revoque).not.toBe(courant);
  });

  it('retombe sur l adresse quand le jeton est absent ou illisible', () => {
    expect(suivreParParticipant(requete())).toBe(`ip:${IP_SALLE}`);
    expect(suivreParParticipant(requeteDe('.sans-identifiant'))).toBe(
      `ip:${IP_SALLE}`,
    );
  });

  it('refuse un jeton bien forme mais non signe et compte par adresse', () => {
    const forge = `${THEO}.0.empreinte-inventee`;

    expect(suivreParParticipant(requeteDe(forge))).toBe(`ip:${IP_SALLE}`);
  });

  it('ne laisse pas un jeton forge fabriquer un seau neuf a chaque requete', () => {
    const cles = new Set(
      Array.from({ length: 5 }, (_, index) =>
        suivreParParticipant(
          requeteDe(`${THEO}-${index}.0.empreinte-inventee`),
        ),
      ),
    );

    expect([...cles]).toEqual([`ip:${IP_SALLE}`]);
  });

  it('refuse un jeton valide emis pour une autre seance', () => {
    const jetonAilleurs = tokens.sign(AUTRE_SESSION, THEO, 0);

    expect(suivreParParticipant(requeteDe(jetonAilleurs))).toBe(
      `ip:${IP_SALLE}`,
    );
  });

  it('retombe sur l adresse quand la route ne porte pas de seance', () => {
    expect(suivreParParticipant(requeteDe(jetonTheo, { params: {} }))).toBe(
      `ip:${IP_SALLE}`,
    );
  });

  it('ne laisse pas une requete sans adresse echapper au comptage', () => {
    expect(suivreParParticipant({ params: {}, headers: {} })).toBe(
      'ip:inconnue',
    );
  });
});
