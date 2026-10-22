import type { VerrouParBoite } from '../../../common/domain/verrou-par-boite';
import {
  AuditSnapshot,
  AuditSummarySnapshot,
  UpdateAuditStateInput,
} from './AuditProcessing';
import { AuditRequest } from './AuditRequest';
import { AuditRequestResponse } from './AuditRequestResponse';

export interface IAuditRequestsRepository extends VerrouParBoite<IAuditRequestsRepository> {
  create(
    data: AuditRequest,
    empreinteDeConfirmation: string | null,
  ): Promise<AuditRequestResponse>;
  confirmer(empreinteDeConfirmation: string): Promise<string | null>;
  secondesAvantLaSortieDesDemandesVers(
    contactValue: string,
    fenetreMs: number,
  ): Promise<readonly number[]>;
  findById(id: string): Promise<AuditSnapshot | null>;
  findSummaryById(id: string): Promise<AuditSummarySnapshot | null>;
  updateState(id: string, state: UpdateAuditStateInput): Promise<void>;
}
