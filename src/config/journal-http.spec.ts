import { once } from 'node:events';
import { createServer, request, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Writable } from 'node:stream';
import pinoHttp from 'pino-http';
import { optionsJournalHttp } from './journal-http';

const JETON_FORMATEUR = 'Bearer jeton-formateur-secret';
const JETON_PARTICIPANT = 'participant.empreinte-secrete';
const COOKIE_REQUETE = 'refresh=cookie-secret';
const COOKIE_REPONSE = 'refresh=cookie-renouvele-secret';
const CENSURE = '[REDACTED]';

interface LigneDeJournal {
  req: { headers: Record<string, unknown> };
  res: { headers: Record<string, unknown> };
}

const EVENEMENT_LIGNE = 'ligne';

function fluxDeJournal(): Writable {
  return new Writable({
    write(morceau: Buffer, _encodage, suite) {
      this.emit(EVENEMENT_LIGNE, JSON.parse(morceau.toString('utf8')));
      suite();
    },
  });
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
          'x-participant-token': JETON_PARTICIPANT,
          cookie: COOKIE_REQUETE,
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

  it('censure les en-tetes d authentification dans la ligne request completed de production', async () => {
    const flux = fluxDeJournal();
    const ligne = once(flux, EVENEMENT_LIGNE);
    const journal = pinoHttp(optionsJournalHttp('production'), flux);
    serveur = createServer((requete, reponse) => {
      journal(requete, reponse);
      reponse.setHeader('set-cookie', COOKIE_REPONSE);
      reponse.end('ok');
    });

    await appeler(await ecouter(serveur));
    const [ecrite] = (await ligne) as [LigneDeJournal];

    expect({
      authorization: ecrite.req.headers['authorization'],
      participant: ecrite.req.headers['x-participant-token'],
      cookie: ecrite.req.headers['cookie'],
      setCookie: ecrite.res.headers['set-cookie'],
    }).toEqual({
      authorization: CENSURE,
      participant: CENSURE,
      cookie: CENSURE,
      setCookie: CENSURE,
    });
    const brute = JSON.stringify(ecrite);
    for (const secret of [
      JETON_FORMATEUR,
      JETON_PARTICIPANT,
      COOKIE_REQUETE,
      COOKIE_REPONSE,
    ]) {
      expect(brute).not.toContain(secret);
    }
  });

  it('reste muet en environnement de test', () => {
    expect(optionsJournalHttp('test').level).toBe('silent');
  });
});
