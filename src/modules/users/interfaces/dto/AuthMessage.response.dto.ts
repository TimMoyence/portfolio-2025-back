import { ApiProperty } from '@nestjs/swagger';

export class AuthMessageResponseDto {
  @ApiProperty({
    example:
      'Si un compte existe avec cet email, un lien de reinitialisation a ete envoye.',
  })
  message: string;
}
