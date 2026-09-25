import { empreinteCanonique } from '../src/modules/formations/domain/cours/EmpreinteCanonique';
import { buildContenuAPublierB2_01 } from './factories/cours-b2-01.factory';
import { describeDb } from './helpers/db-integration-datasource';
import {
  CODE_HTTP,
  installerBancDeSeance,
} from './helpers/formations-banc-seance';
import { attendreVersionServie } from './helpers/schema-openapi';

const CONTENU = buildContenuAPublierB2_01();
const SLUG = CONTENU.slug;
const { OK, INTROUVABLE } = CODE_HTTP;
const SLUG_JAMAIS_PUBLIE = 'cours-insere-sans-publication';

interface LigneDeVersion {
  version: number;
  empreinte: string | null;
}

function contenuCorrige(): typeof CONTENU {
  const [premier, ...suivants] = CONTENU.ecrans;
  return {
    ...CONTENU,
    ecrans: [
      { ...premier, notes: `${premier.notes} Relance ajoutée par la QA.` },
      ...suivants,
    ],
  };
}

describeDb('Synchronisation du cours publié (db integration)', () => {
  const banc = installerBancDeSeance({ slug: SLUG });
  const contexte = () => banc.contexte();

  const versionsEnBase = async (): Promise<LigneDeVersion[]> =>
    await contexte().dataSource.query(
      `SELECT "version", "empreinte" FROM "formation_course_contents"
       WHERE "slug" = $1 ORDER BY "version"`,
      [SLUG],
    );

  const ouvrirSeance = async (): Promise<string> =>
    (await banc.ouvrir()).sessionId;

  it('publie le cours du fichier avec son empreinte sur une base neuve', async () => {
    expect(await versionsEnBase()).toEqual([
      { version: 1, empreinte: empreinteCanonique(CONTENU) },
    ]);
    expect(await contexte().publication.empreintePubliee(SLUG)).toBe(
      empreinteCanonique(CONTENU),
    );
  });

  it('ne publie rien quand le fichier du cours n’a pas changé', async () => {
    const issues = await contexte().synchroniser([CONTENU]);

    expect(issues).toEqual([{ slug: SLUG, statut: 'a-jour' }]);
    expect(await versionsEnBase()).toHaveLength(1);
  });

  it('sert le contenu publié et sa date de publication au catalogue public', async () => {
    const reponse = await banc.anonyme('get', `/catalogue/${SLUG}`).expect(OK);

    attendreVersionServie(reponse.body, 1);
  });

  it('ne sert ni au public ni à une séance un slug inséré sans publication', async () => {
    await contexte().dataSource.query(
      `INSERT INTO "formation_course_contents"
           ("slug", "version", "titre", "niveau", "duree_minutes", "concepts")
         VALUES ($1, 1, 'Brouillon jamais publie', 'B2', 5, '["proportion"]'::jsonb)`,
      [SLUG_JAMAIS_PUBLIE],
    );

    const publique = await banc.anonyme(
      'get',
      `/catalogue/${SLUG_JAMAIS_PUBLIE}`,
    );
    const parUnFormateur = await banc
      .formateur('post', '/sessions')
      .send({ courseSlug: SLUG_JAMAIS_PUBLIE });

    expect({
      publique: publique.status,
      seance: parUnFormateur.status,
    }).toEqual({ publique: INTROUVABLE, seance: INTROUVABLE });
  });

  it('publie le cours corrigé sans toucher au contenu des séances déjà ouvertes', async () => {
    const ouverteAvant = await ouvrirSeance();
    const corrige = contenuCorrige();

    const issues = await contexte().synchroniser([corrige]);

    expect(issues).toEqual([{ slug: SLUG, statut: 'publie', version: 2 }]);
    expect(await versionsEnBase()).toEqual([
      { version: 1, empreinte: empreinteCanonique(CONTENU) },
      { version: 2, empreinte: empreinteCanonique(corrige) },
    ]);
    const seance = await contexte().sessions.findById(ouverteAvant);
    const coursDeLaSeance = await contexte().catalogue.trouver(
      SLUG,
      seance?.courseVersion,
    );
    expect(coursDeLaSeance?.ecrans[0].notes).toBe(CONTENU.ecrans[0].notes);
  });

  it('ouvre les nouvelles séances sur le cours corrigé', async () => {
    const seance = await contexte().sessions.findById(await ouvrirSeance());
    const cours = await contexte().catalogue.trouver(
      SLUG,
      seance?.courseVersion,
    );

    expect(cours?.ecrans[0].notes).toBe(contenuCorrige().ecrans[0].notes);
  });

  it('ne publie qu une version quand deux instances synchronisent le même cours en même temps', async () => {
    const [premier, ...suivants] = CONTENU.ecrans;
    const recorrige = {
      ...CONTENU,
      ecrans: [
        { ...premier, notes: `${premier.notes} Seconde relance de la QA.` },
        ...suivants,
      ],
    };

    const issues = await Promise.all([
      contexte().synchroniser([recorrige]),
      contexte().synchroniser([recorrige]),
    ]);

    for (const issue of issues.flat()) {
      expect([
        { slug: SLUG, statut: 'a-jour' },
        { slug: SLUG, statut: 'publie', version: 3 },
      ]).toContainEqual(issue);
    }
    const versions = await versionsEnBase();
    expect(versions.map(({ version }) => version)).toEqual([1, 2, 3]);
    expect(versions[2].empreinte).toBe(empreinteCanonique(recorrige));
  });
});
