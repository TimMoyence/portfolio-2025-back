import type { INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { createHash } from 'node:crypto';
import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { estObjet } from '../../src/common/domain/est-objet';
import { lecteurDeTrames } from './trames-sse';

export const DOSSIER_DES_REPONSES_SERVIES = 'ENREGISTRER_REPONSES_SERVIES';

const TYPE_DU_FLUX = 'text/event-stream';
const LONGUEUR_D_EMPREINTE = 16;

function signature(valeur: unknown): unknown {
  if (Array.isArray(valeur)) {
    return [
      ...new Set(valeur.map((element) => JSON.stringify(signature(element)))),
    ].sort((a, b) => a.localeCompare(b));
  }
  if (estObjet(valeur)) {
    return Object.fromEntries(
      Object.keys(valeur)
        .sort((a, b) => a.localeCompare(b))
        .map((cle) => [cle, signature(valeur[cle])]),
    );
  }
  return valeur === null ? null : typeof valeur;
}

function consigner(dossier: string, route: string, corps: unknown): void {
  const empreinte = createHash('sha256')
    .update(`${route}\n${JSON.stringify(signature(corps))}`)
    .digest('hex')
    .slice(0, LONGUEUR_D_EMPREINTE);
  mkdirSync(dossier, { recursive: true });
  const fichier = join(dossier, `${empreinte}.json`);
  const provisoire = `${fichier}.${process.pid}`;
  writeFileSync(provisoire, JSON.stringify({ route, corps }));
  renameSync(provisoire, fichier);
}

function routeDe(req: Request): string | null {
  const chemin = (req.route as { path?: unknown } | undefined)?.path;
  return typeof chemin === 'string' ? `${req.method} ${chemin}` : null;
}

function estUnFlux(res: Response, entetes: unknown): boolean {
  const declare = estObjet(entetes)
    ? Object.entries(entetes).find(
        ([nom]) => nom.toLowerCase() === 'content-type',
      )?.[1]
    : undefined;
  const type = declare ?? res.getHeader('content-type');
  return typeof type === 'string' && type.includes(TYPE_DU_FLUX);
}

function consignerLesCorps(dossier: string, req: Request, res: Response) {
  const json = res.json.bind(res);
  res.json = (corps: unknown) => {
    const route = routeDe(req);
    if (route !== null && res.statusCode < 300) {
      consigner(dossier, route, corps);
    }
    return json(corps);
  };
}

function consignerLesTrames(dossier: string, req: Request, res: Response) {
  const lire = lecteurDeTrames();
  let flux = false;
  const ecrireLEntete = res.writeHead.bind(res) as (
    ...args: unknown[]
  ) => Response;
  res.writeHead = ((statut: number, ...reste: unknown[]) => {
    flux = estUnFlux(res, reste.find(estObjet));
    return ecrireLEntete(statut, ...reste);
  }) as Response['writeHead'];
  const ecrire = res.write.bind(res) as (...args: unknown[]) => boolean;
  res.write = ((morceau: unknown, ...reste: unknown[]) => {
    const route = routeDe(req);
    if (flux && route !== null) {
      const texte = Buffer.isBuffer(morceau)
        ? morceau.toString('utf8')
        : String(morceau);
      for (const { type, donnees } of lire(texte)) {
        consigner(dossier, `${route} ${type}`, donnees);
      }
    }
    return ecrire(morceau, ...reste);
  }) as Response['write'];
}

export function enregistrerLesReponsesServies(app: INestApplication): void {
  const dossier = process.env[DOSSIER_DES_REPONSES_SERVIES];
  if (dossier === undefined || dossier === '') {
    return;
  }
  app.use((req: Request, res: Response, next: NextFunction) => {
    consignerLesCorps(dossier, req, res);
    consignerLesTrames(dossier, req, res);
    next();
  });
}
