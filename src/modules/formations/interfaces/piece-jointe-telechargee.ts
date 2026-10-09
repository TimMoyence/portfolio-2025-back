import {
  applyDecorators,
  Header,
  Injectable,
  StreamableFile,
  UseInterceptors,
} from '@nestjs/common';
import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProduces } from '@nestjs/swagger';
import { map, type Observable } from 'rxjs';
import type { ClasseurTelecharge } from '../domain/IClasseursDeCours.port';

function fichierTelecharge({
  nom,
  type,
  contenu,
}: ClasseurTelecharge): StreamableFile {
  return new StreamableFile(contenu, {
    type,
    disposition: `attachment; filename="${nom}"`,
    length: contenu.byteLength,
  });
}

@Injectable()
class EnPieceJointe implements NestInterceptor<
  ClasseurTelecharge,
  StreamableFile
> {
  intercept(
    _contexte: ExecutionContext,
    suite: CallHandler<ClasseurTelecharge>,
  ): Observable<StreamableFile> {
    return suite.handle().pipe(map(fichierTelecharge));
  }
}

export function TelechargementDePieceJointe(resume: string): MethodDecorator {
  return applyDecorators(
    UseInterceptors(EnPieceJointe),
    Header('Cache-Control', 'private, no-store'),
    ApiOperation({ summary: resume }),
    ApiProduces(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/pdf',
    ),
    ApiOkResponse({
      description: 'Classeur réservé à la séance, en pièce jointe',
      schema: { type: 'string', format: 'binary' },
    }),
  );
}
