import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { CreateContactsUseCase } from '../application/CreateContacts.useCase';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/interfaces/auth/public.decorator';
import { CreateContactCommand } from '../application/dto/CreateContact.command';
import { ContactResponseDto } from './dto/contact.response.dto';
import { ContactRequestDto } from './dto/contact.request.dto';

@ApiTags('contacts')
@Controller('contacts')
export class ContactsController {
  constructor(private readonly createUseCase: CreateContactsUseCase) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @Post()
  @ApiOperation({ summary: 'Envoyer un message de contact (acces public)' })
  @ApiCreatedResponse({ type: ContactResponseDto })
  @ApiBadRequestResponse({ description: 'Validation echouee' })
  async create(@Body() dto: ContactRequestDto): Promise<ContactResponseDto> {
    const command: CreateContactCommand = {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone ?? null,
      subject: dto.subject,
      message: dto.message,
      role: dto.role,
      terms: dto.terms,
      termsVersion: dto.termsVersion ?? undefined,
      termsLocale: dto.termsLocale ?? undefined,
      termsAcceptedAt: dto.termsAcceptedAt ?? undefined,
      termsMethod: dto.termsMethod ?? undefined,
    };

    const response = await this.createUseCase.execute(command);
    const responseDto = new ContactResponseDto();
    responseDto.message = response.message;
    responseDto.httpCode = HttpStatus.CREATED;
    return responseDto;
  }
}
