import { IsString, Length } from 'class-validator';

export class RenameFormationGroupRequestDto {
  @IsString()
  @Length(1, 80)
  name: string;
}
