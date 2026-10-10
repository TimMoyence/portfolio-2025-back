import type { ClasseurTelecharge } from './IClasseursDeCours.port';
import type { RapportSession } from './IFormationMailer.port';

const BOM_UTF8 = '﻿';

const ENTETES = [
  'prénom',
  'nom',
  'email',
  'question',
  'concept',
  'réponse',
  'correcte',
  'confusion',
  'durée_ms',
];

const CONCEPT_D_UNE_REPONSE_LIBRE = 'réponse libre';

export function rapportEnCsv(rapport: RapportSession): ClasseurTelecharge {
  const lignes = rapport.participants.flatMap((participant) => {
    const etudiant = [participant.prenom, participant.nom, participant.email];
    return [
      ...participant.reponses.map((reponse) => [
        ...etudiant,
        reponse.questionId,
        reponse.concept,
        reponse.reponse,
        reponse.correcte ? 'oui' : 'non',
        reponse.libelleConfusion ?? '',
        String(reponse.dureeMs),
      ]),
      ...participant.reponsesLibres.map((libre) => [
        ...etudiant,
        libre.activityId,
        CONCEPT_D_UNE_REPONSE_LIBRE,
        libre.reponse,
        '',
        '',
        '',
      ]),
    ].map(ligneCsv);
  });
  const texte = `${BOM_UTF8}${[ENTETES.join(';'), ...lignes].join('\r\n')}`;
  return {
    nom: `session-${rapport.code}.csv`,
    type: 'text/csv; charset=utf-8',
    contenu: new TextEncoder().encode(texte),
  };
}

function ligneCsv(cellules: readonly string[]): string {
  return cellules
    .map((cellule) => `"${neutraliserCelluleCsv(cellule).replace(/"/g, '""')}"`)
    .join(';');
}

const CARACTERES_FORMULE_RE = /^[=+@\t\r]/;
const NOMBRE_NEGATIF_VALIDE_RE = /^-\d+([.,]\d+)?$/;

/**
 * CWE-1236 : neutralise une cellule CSV qu'Excel interpreterait comme une
 * formule a l'ouverture (nom d'etudiant en `=HYPERLINK(...)`, reponse
 * libre en `+`/`@`...), en la prefixant d'une apostrophe. Le signe moins
 * est traite a part : les destinataires sont des comptables, `-1500` ou
 * `-12,5` sont des montants legitimes qui doivent rester sommables — seule
 * une cellule commencant par `-` sans etre un nombre valide (`-=1+1`,
 * `--cmd`) est neutralisee.
 */
function neutraliserCelluleCsv(valeur: string): string {
  if (CARACTERES_FORMULE_RE.test(valeur)) {
    return `'${valeur}`;
  }
  if (valeur.startsWith('-') && !NOMBRE_NEGATIF_VALIDE_RE.test(valeur)) {
    return `'${valeur}`;
  }
  return valeur;
}
