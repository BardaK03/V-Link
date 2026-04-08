import { IsUUID } from 'class-validator';

export class AutoSplitDto {
  @IsUUID()
  role_id: string;
}
