import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService } from './app.service';
import { Public } from './common/interfaces/auth/public.decorator';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @SkipThrottle()
  @Get()
  @ApiOperation({ summary: "Point d'entree racine de l'API" })
  @ApiOkResponse({ description: 'Message de bienvenue', type: String })
  getHello(): string {
    return this.appService.getHello();
  }
}
