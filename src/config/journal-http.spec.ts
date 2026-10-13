import { once } from 'node:events';
import { createServer, request, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import pinoHttp from 'pino-http';
import {
  EVENEMENT_LIGNE,
  fluxDeJournal,
  type LigneEcrite,
} from '../../test/helpers/flux-de-journal';
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

interface LigneDeJournal {
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

function appeler(port: number): Promise<void> {
  return new Promise((resoudre, rejeter) => {
    const appel = request(
      {
        host: '127.0.0.1',
        port,
        path: '/api/v1/portfolio25/formations/sessions/s/sujet',
        headers: {
          authorization: JETON_FORMATEUR,
          [EN_TETE_JETON]: JETON_PARTICIPANT,
          cookie: COOKIE_REQUETE,
          referer: `${PAGE_DU_TOOLKIT}/${JETON_DE_PAGE}`,
        },
      },
      (reponse) => {
        reponse.resume();
        reponse.on('end', resoudre);
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

  it('censure les en-tetes d authentification et le jeton du referent dans la ligne request completed de production', async () => {
    const flux = fluxDeJournal();
    const ligne = once(flux, EVENEMENT_LIGNE);
    const journal = pinoHttp(optionsJournalHttp('production'), flux);
    serveur = createServer((requete, reponse) => {
      journal(requete, reponse);
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

  it('reste muet en environnement de test', () => {
    expect(optionsJournalHttp('test').level).toBe('silent');
  });
});
