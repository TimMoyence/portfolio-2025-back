import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateContactsUseCase } from '../application/CreateContacts.useCase';
import { ApiBadRequestResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { ContactResponseDto } from './dto/contact.response.dto';
import { ContactDto } from '../application/dto/Contact.dto';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly createUseCase: CreateContactsUseCase) {}

  @Get()
  findAll() {
    return [];
  }

  @Post()
  @ApiCreatedResponse({ type: ContactResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async create(@Body() dto: ContactDto): Promise<ContactResponseDto> {
    const createContacts = await this.createUseCase.execute(dto);
    if (createContacts) {
      const responseDto = new ContactResponseDto();
      responseDto.message = 'Contact message created successfully.';
      responseDto.httpCode = 201;
      return responseDto;
    } else {
      const responseDto = new ContactResponseDto();
      responseDto.message = 'Failed to create contact message.';
      responseDto.httpCode = 500;
      return responseDto;
    }
  }
}
