import {
  buildRapportAvecReponses,
  buildRapportQuestion,
  buildRapportSession,
} from '../../../../test/factories/formation.factory';
import type { RapportSession } from './IFormationMailer.port';
import { rapportEnCsv } from './RapportCsv';

const LIBELLE_CONFUSION = 'Croire que la hausse et la baisse s annulent.';

function texteDe(rapport: RapportSession): string {
  return Buffer.from(rapportEnCsv(rapport).contenu).toString('utf8');
}

describe('rapportEnCsv', () => {
  it('nomme le fichier par le code de la séance et le sert en CSV UTF-8', () => {
    const { nom, type } = rapportEnCsv(buildRapportSession());

    expect({ nom, type }).toEqual({
      nom: 'session-4271.csv',
      type: 'text/csv; charset=utf-8',
    });
  });

  it('produit un csv au format Excel francais : BOM, point-virgule, CRLF', () => {
    const csv = texteDe(
      buildRapportAvecReponses([
        buildRapportQuestion({
          questionId: 'Q-CAP-03',
          valeur: '1338.23',
          reponse: '1338.23',
          dureeMs: 42000,
        }),
      ]),
    );

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const lignes = csv.slice(1).split('\r\n');
    expect(lignes[0]).toBe(
      'prénom;nom;email;question;concept;réponse;correcte;confusion;durée_ms',
    );
    expect(lignes[1]).toContain(';');
    expect(lignes[1]).not.toContain(',');
  });

  it('ecrit le libelle de l option choisie et celui de la confusion, jamais leurs identifiants', () => {
    const csv = texteDe(
      buildRapportAvecReponses([
        buildRapportQuestion({
          questionId: 'Q-VOTE',
          valeur: 'o3',
          reponse: 'revenu au prix de départ',
          correcte: false,
          misconception: 'hausse-baisse-symetriques',
          libelleConfusion: LIBELLE_CONFUSION,
        }),
      ]),
    );
    const cellules = csv.slice(1).split('\r\n')[1].split(';');

    expect({ reponse: cellules[5], confusion: cellules[7] }).toEqual({
      reponse: '"revenu au prix de départ"',
      confusion: `"${LIBELLE_CONFUSION}"`,
    });
    expect(csv).not.toContain('"o3"');
    expect(csv).not.toContain('hausse-baisse-symetriques');
  });

  it('V6 · ajoute une ligne par réponse libre du participant, après ses réponses notées et sans verdict', () => {
    const lignes = texteDe(
      buildRapportAvecReponses([buildRapportQuestion()], {
        reponsesLibres: [
          {
            screenId: 'B3-01-A1-15-REGLES-ACTE-1',
            activityId: 'b3-01-a1-regles:regle-comprendre',
            reponse: '=SOMME seulement après la colonne "controle"',
          },
        ],
      }),
    )
      .slice(1)
      .split('\r\n');

    expect(lignes).toHaveLength(3);
    expect(lignes[2].split(';')).toEqual([
      '"Theo"',
      '"Martin"',
      '"theo.martin@example.com"',
      '"b3-01-a1-regles:regle-comprendre"',
      '"réponse libre"',
      '"\'=SOMME seulement après la colonne ""controle"""',
      '""',
      '""',
      '""',
    ]);
  });

  it('neutralise un nom d etudiant commencant par un signe egal', () => {
    const csv = texteDe(
      buildRapportAvecReponses([buildRapportQuestion()], {
        prenom: '=HYPERLINK("http://evil.example","Cliquez ici")',
      }),
    );

    expect(csv).toContain('"\'=HYPERLINK');
  });

  it('laisse un montant negatif intact et sommable', () => {
    const csv = texteDe(
      buildRapportAvecReponses([
        buildRapportQuestion({ valeur: '-1500', reponse: '-1500' }),
      ]),
    );

    expect(csv).toContain('"-1500"');
    expect(csv).not.toContain('"\'-1500"');
  });

  it.each([
    ['un signe plus ou une arobase', '+1+1', '@SUM(A1)'],
    ['un signe moins qui n est pas un nombre valide', '-=1+1', '--cmd'],
  ])('neutralise une reponse commencant par %s', (_cas, premiere, seconde) => {
    const csv = texteDe(
      buildRapportAvecReponses([
        buildRapportQuestion({
          questionId: 'Q-1',
          reponse: premiere,
          correcte: false,
        }),
        buildRapportQuestion({
          questionId: 'Q-2',
          reponse: seconde,
          correcte: false,
        }),
      ]),
    );

    expect(csv).toContain(`"'${premiere}"`);
    expect(csv).toContain(`"'${seconde}"`);
  });
});
