import { Injectable, ParseUUIDPipe } from '@nestjs/common';
import type { ArgumentMetadata, PipeTransform } from '@nestjs/common';

export interface CibleParticipant {
  readonly id: string;
  readonly participantId: string;
}

@Injectable()
export class CibleParticipantPipe implements PipeTransform<
  Record<string, string>,
  Promise<CibleParticipant>
> {
  private readonly uuid = new ParseUUIDPipe();

  async transform(
    params: Record<string, string>,
    metadonnees: ArgumentMetadata,
  ): Promise<CibleParticipant> {
    const id = await this.uuid.transform(params['id'], metadonnees);
    const participantId = await this.uuid.transform(
      params['participantId'],
      metadonnees,
    );
    return { id, participantId };
  }
}
