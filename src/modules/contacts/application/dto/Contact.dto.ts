import { ApiProperty } from '@nestjs/swagger';

export class ContactDto {
  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'Hello, I would like to get in touch.' })
  message: string;

  @ApiProperty({ example: '+11234567890', nullable: true })
  phone?: string | null;

  @ApiProperty({ example: 'Devis Asking' })
  subject: string;

  @ApiProperty({ example: 'Manager' })
  role: string;

  @ApiProperty({ example: true, default: false })
  terms: boolean;
}
