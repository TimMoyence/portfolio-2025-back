import { once } from 'node:events';
import {
  createServer,
  request,
  type IncomingHttpHeaders,
  type OutgoingHttpHeaders,
  type Server,
  type ServerResponse,
} from 'node:http';
import type { AddressInfo } from 'node:net';
import pinoHttp from 'pino-http';
import {
  EVENEMENT_LIGNE,
  fluxDeJournal,
  type LigneEcrite,
} from '../../test/helpers/flux-de-journal';
import {
  attendreUnNavigateurEtUnReferentBornes,
  PROVENANCE_DEMESUREE,
} from '../../test/helpers/provenance';
import { JETON_DE_PAGE } from '../../test/helpers/referents-des-pages-a-jeton';
import { EN_TETE_JETON } from '../modules/formations/interfaces/ParticipantToken.service';
import { optionsJournalHttp } from './journal-http';

const JETON_FORMATEUR = 'Bearer jeton-formateur-secret';
const JETON_PARTICIPANT = 'participant.empreinte-secrete';
const COOKIE_REQUETE = 'refresh=cookie-secret';
const COOKIE_REPONSE = 'refresh=cookie-renouvele-secret';
const PAGE_DU_TOOLKIT =
  'https://asilidesign.fr/fr/formations/ia-solopreneurs/toolkit';
const CENSURE = '[REDACTED]';

const EN_TETES_SECRETS: OutgoingHttpHeaders = {
  authorization: JETON_FORMATEUR,
  [EN_TETE_JETON]: JETON_PARTICIPANT,
  cookie: COOKIE_REQUETE,
  referer: `${PAGE_DU_TOOLKIT}/${JETON_DE_PAGE}`,
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

interface LigneDeJournal {
  correlationId: string;
  req: { headers: Record<string, unknown> };
  res: { headers: Record<string, unknown> };
}

function ecouter(serveur: Server): Promise<number> {
  return new Promise((resoudre) => {
    serveur.listen(0, '127.0.0.1', () =>
      resoudre((serveur.address() as AddressInfo).port),
    );
  });
}

function appeler(
  port: number,
  enTetes: OutgoingHttpHeaders = EN_TETES_SECRETS,
): Promise<IncomingHttpHeaders> {
  return new Promise((resoudre, rejeter) => {
    const appel = request(
      {
        host: '127.0.0.1',
        port,
        path: '/api/v1/portfolio25/formations/sessions/s/sujet',
        headers: enTetes,
      },
      (reponse) => {
        reponse.resume();
        reponse.on('end', () => resoudre(reponse.headers));
      },
    );
    appel.on('error', rejeter);
    appel.end();
  });
}

describe('optionsJournalHttp', () => {
  let serveur: Server;

  afterEach(async () => {
    await new Promise((resoudre) => serveur.close(resoudre));
  });

  function servirEnProduction(
    repondre: (reponse: ServerResponse) => void,
  ): Promise<unknown[]> {
    const flux = fluxDeJournal();
    const ligne = once(flux, EVENEMENT_LIGNE);
    const journal = pinoHttp(optionsJournalHttp('production'), flux);
    serveur = createServer({ maxHeaderSize: 64 * 1024 }, (requete, reponse) => {
      journal(requete, reponse);
      repondre(reponse);
    });
    return ligne;
  }

  it('censure les en-tetes d authentification et le jeton du referent dans la ligne request completed de production', async () => {
    const ligne = servirEnProduction((reponse) => {
      reponse.setHeader('set-cookie', COOKIE_REPONSE);
      reponse.end('ok');
    });

    await appeler(await ecouter(serveur));
    const [{ brute, champs }] = (await ligne) as [LigneEcrite];
    const ecrite = champs as LigneDeJournal;

    expect({
      authorization: ecrite.req.headers['authorization'],
      participant: ecrite.req.headers[EN_TETE_JETON],
      cookie: ecrite.req.headers['cookie'],
      referer: ecrite.req.headers['referer'],
      setCookie: ecrite.res.headers['set-cookie'],
    }).toEqual({
      authorization: CENSURE,
      participant: CENSURE,
      cookie: CENSURE,
      referer: `${PAGE_DU_TOOLKIT}/${CENSURE}`,
      setCookie: CENSURE,
    });
    for (const secret of [
      JETON_FORMATEUR,
      JETON_PARTICIPANT,
      COOKIE_REQUETE,
      COOKIE_REPONSE,
      JETON_DE_PAGE,
    ]) {
      expect(brute).not.toContain(secret);
    }
  });

  it('borne le navigateur et le referent de la ligne request completed de production', async () => {
    const ligne = servirEnProduction((reponse) => {
      reponse.end('ok');
    });

    await appeler(await ecouter(serveur), {
      'user-agent': PROVENANCE_DEMESUREE.userAgent,
      referer: PROVENANCE_DEMESUREE.referer,
    });
    const [{ champs }] = (await ligne) as [LigneEcrite];
    const { headers } = (champs as LigneDeJournal).req;

    attendreUnNavigateurEtUnReferentBornes({
      userAgent: headers['user-agent'] as string,
      referer: headers['referer'] as string,
    });
  });

  async function identifiantsDeLaRequete(
    enTetes: OutgoingHttpHeaders,
  ): Promise<{ journalise: string; renvoye: unknown }> {
    const ligne = servirEnProduction((reponse) => {
      reponse.end('ok');
    });

    const reponse = await appeler(await ecouter(serveur), enTetes);
    const [{ champs }] = (await ligne) as [LigneEcrite];
    return {
      journalise: (champs as LigneDeJournal).correlationId,
      renvoye: reponse['x-request-id'],
    };
  }

  it('pose sur la réponse l identifiant de corrélation qu il journalise', async () => {
    const { journalise, renvoye } = await identifiantsDeLaRequete({});

    expect(journalise).toMatch(UUID);
    expect(renvoye).toBe(journalise);
  });

  it('reprend l identifiant de corrélation reçu quand il est recevable', async () => {
    const { journalise, renvoye } = await identifiantsDeLaRequete({
      'x-request-id': 'amont-42.lb:edge_1',
    });

    expect(journalise).toBe('amont-42.lb:edge_1');
    expect(renvoye).toBe('amont-42.lb:edge_1');
  });

  it.each([
    ['trop long', 'a'.repeat(129)],
    ['hors alphabet', 'id avec espace<script>'],
  ])(
    'remplace un identifiant de corrélation reçu %s par un identifiant tiré',
    async (_cas, recu) => {
      const { journalise, renvoye } = await identifiantsDeLaRequete({
        'x-request-id': recu,
      });

      expect(journalise).toMatch(UUID);
      expect(renvoye).toBe(journalise);
    },
  );

  it('reste muet en environnement de test', () => {
    expect(optionsJournalHttp('test').level).toBe('silent');
  });
});
