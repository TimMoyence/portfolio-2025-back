import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestToolkitUseCase } from './application/RequestToolkit.useCase';
import {
  LEAD_MAGNET_NOTIFIER,
  LEAD_MAGNET_REQUEST_REPOSITORY,
  TOOLKIT_PDF_GENERATOR,
} from './domain/token';
import { LeadMagnetMailerService } from './infrastructure/LeadMagnetMailer.service';
import { LeadMagnetRequestRepositoryTypeORM } from './infrastructure/LeadMagnetRequest.repository.typeorm';
import { ToolkitPdfGeneratorService } from './infrastructure/ToolkitPdfGenerator.service';
import { LeadMagnetRequestEntity } from './infrastructure/entities/LeadMagnetRequest.entity';
import { LeadMagnetsController } from './interfaces/LeadMagnets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LeadMagnetRequestEntity])],
  controllers: [LeadMagnetsController],
  providers: [
    RequestToolkitUseCase,
    {
      provide: LEAD_MAGNET_REQUEST_REPOSITORY,
      useClass: LeadMagnetRequestRepositoryTypeORM,
    },
    {
      provide: LEAD_MAGNET_NOTIFIER,
      useClass: LeadMagnetMailerService,
    },
    {
      provide: TOOLKIT_PDF_GENERATOR,
      useClass: ToolkitPdfGeneratorService,
    },
  ],
})
export class LeadMagnetsModule {}
