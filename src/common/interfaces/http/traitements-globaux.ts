import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';
import { DomainExceptionFilter } from '../filters/DomainExceptionFilter';
import { RefusDeLOctetNulPipe } from './refus-de-l-octet-nul.pipe';

export const OPTIONS_DE_VALIDATION_GLOBALE = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
};

export function appliquerLesTraitementsGlobaux(app: INestApplication): void {
  app.useGlobalFilters(new AllExceptionsFilter(), new DomainExceptionFilter());
  app.useGlobalPipes(
    new RefusDeLOctetNulPipe(),
    new ValidationPipe(OPTIONS_DE_VALIDATION_GLOBALE),
  );
}
