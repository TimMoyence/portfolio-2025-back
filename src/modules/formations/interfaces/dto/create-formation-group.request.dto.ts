import { IsString, Length } from 'class-validator';

export class CreateFormationGroupRequestDto {
  @IsString()
  @Length(1, 80)
  name: string;
}
