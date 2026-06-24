import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateVolunteerLogDto {
  @IsUUID()
  user_id: string;

  @IsOptional()
  @IsUUID()
  event_id?: string;

  @IsNumber()
  @Min(0.5)
  hours_worked: number;
}
