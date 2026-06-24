import { IsOptional, IsString, IsNumber, IsArray, Min, MaxLength } from 'class-validator';

export class UpdateEventRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  role_name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  slots_needed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hours_required?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  points_reward?: number;

  @IsOptional()
  @IsArray()
  required_skills?: number[];
}
