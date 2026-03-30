import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, ValidateNested, IsInt, Min } from 'class-validator';

export class CreateEventRoleDto {
  @IsString()
  @IsNotEmpty()
  role_name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  slots_needed: number;

  @IsInt()
  @Min(0)
  hours_required: number;

  @IsInt()
  @Min(0)
  points_reward: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  required_skills?: number[];
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventRoleDto)
  roles?: CreateEventRoleDto[];
}
