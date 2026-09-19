import { IsUUID } from 'class-validator';

export class AssignFormationGroupRequestDto {
  @IsUUID()
  groupId: string;
}
