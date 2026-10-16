import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AuditRequestRequestDto } from '../../../modules/audit-requests/interfaces/dto/audit-request.request.dto';
import { ContactRequestDto } from '../../../modules/contacts/interfaces/dto/contact.request.dto';
import { JoinSessionRequestDto } from '../../../modules/formations/interfaces/dto/join-session.request.dto';
import { RequestToolkitRequestDto } from '../../../modules/lead-magnets/interfaces/dto/request-toolkit.request.dto';
import { SubscribeNewsletterRequestDto } from '../../../modules/newsletter/interfaces/dto/subscribe-newsletter.request.dto';
import { ChampsAntiRobotDto } from './champs-anti-robot.dto';

const FORMULAIRES_PUBLICS = [
  AuditRequestRequestDto,
  ContactRequestDto,
  JoinSessionRequestDto,
  RequestToolkitRequestDto,
  SubscribeNewsletterRequestDto,
];

const proprietesEnErreur = (corps: Record<string, unknown>): string[] =>
  validateSync(plainToInstance(ChampsAntiRobotDto, corps)).map(
    (erreur) => erreur.property,
  );

describe('ChampsAntiRobotDto', () => {
  it('accepte un formulaire sans champ anti-robot', () => {
    expect(proprietesEnErreur({})).toEqual([]);
  });

  it('refuse un piege de plus de 200 caracteres', () => {
    expect(proprietesEnErreur({ website: 'x'.repeat(201) })).toEqual([
      'website',
    ]);
  });

  it('accepte une duree de saisie entiere et positive', () => {
    expect(proprietesEnErreur({ formFillDurationMs: 20_000 })).toEqual([]);
  });

  it('refuse une duree de saisie negative ou non entiere', () => {
    expect(proprietesEnErreur({ formFillDurationMs: -1 })).toEqual([
      'formFillDurationMs',
    ]);
    expect(proprietesEnErreur({ formFillDurationMs: 1.5 })).toEqual([
      'formFillDurationMs',
    ]);
  });

  it('refuse un horodatage negatif, non entier ou qui n est pas un nombre', () => {
    expect(proprietesEnErreur({ formStartedAt: -1 })).toEqual([
      'formStartedAt',
    ]);
    expect(proprietesEnErreur({ formStartedAt: 1.5 })).toEqual([
      'formStartedAt',
    ]);
    expect(proprietesEnErreur({ formStartedAt: 'hier' })).toEqual([
      'formStartedAt',
    ]);
  });

  it.each(FORMULAIRES_PUBLICS)(
    '%p herite des champs anti-robot',
    (Formulaire) => {
      expect(Formulaire.prototype).toBeInstanceOf(ChampsAntiRobotDto);
    },
  );
});
