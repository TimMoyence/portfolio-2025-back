import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestToolkitUseCase } from './application/RequestToolkit.useCase';
import { GetToolkitByTokenUseCase } from './application/queries/GetToolkitByToken.useCase';
import {
  LEAD_MAGNET_NOTIFIER,
  LEAD_MAGNET_REQUEST_REPOSITORY,
  TOOLKIT_CONTENT_ASSEMBLER,
  TOOLKIT_PDF_GENERATOR,
} from './domain/token';
import { LeadMagnetMailerService } from './infrastructure/LeadMagnetMailer.service';
import { LeadMagnetRequestRepositoryTypeORM } from './infrastructure/LeadMagnetRequest.repository.typeorm';
import { ToolkitContentAssemblerService } from './infrastructure/ToolkitContentAssembler.service';
import { ToolkitHtmlRendererService } from './infrastructure/ToolkitHtmlRenderer.service';
import { ToolkitPdfGeneratorService } from './infrastructure/ToolkitPdfGenerator.service';
import { LeadMagnetRequestEntity } from './infrastructure/entities/LeadMagnetRequest.entity';
import { LeadMagnetsController } from './interfaces/LeadMagnets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LeadMagnetRequestEntity])],
  controllers: [LeadMagnetsController],
  providers: [
    RequestToolkitUseCase,
    GetToolkitByTokenUseCase,
    {
      provide: LEAD_MAGNET_REQUEST_REPOSITORY,
      useClass: LeadMagnetRequestRepositoryTypeORM,
    },
    {
      provide: LEAD_MAGNET_NOTIFIER,
      useClass: LeadMagnetMailerService,
    },
    ToolkitHtmlRendererService,
    {
      provide: TOOLKIT_PDF_GENERATOR,
      useClass: ToolkitPdfGeneratorService,
    },
    {
      provide: TOOLKIT_CONTENT_ASSEMBLER,
      useClass: ToolkitContentAssemblerService,
    },
  ],
})
export class LeadMagnetsModule {}
