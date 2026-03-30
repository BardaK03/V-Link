import { IsUUID } from 'class-validator';

export class CreateApplicationDto {
  @IsUUID()
  role_id: string;
}
