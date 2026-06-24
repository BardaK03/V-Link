import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateApplicationDto {
  @IsUUID()
  role_id: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  motivation_text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  recommendation_text?: string;
}
