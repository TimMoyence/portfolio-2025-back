import { Module } from '@nestjs/common';
import { GetPresentationInteractionsUseCase } from './application/GetPresentationInteractions.useCase';
import { PRESENTATIONS_REPOSITORY } from './domain/token';
import { PresentationsRepositoryInMemory } from './infrastructure/Presentations.repository.inMemory';
import { PresentationsController } from './interfaces/Presentations.controller';

@Module({
  controllers: [PresentationsController],
  providers: [
    GetPresentationInteractionsUseCase,
    {
      provide: PRESENTATIONS_REPOSITORY,
      useClass: PresentationsRepositoryInMemory,
    },
  ],
  exports: [PRESENTATIONS_REPOSITORY],
})
export class PresentationsModule {}
