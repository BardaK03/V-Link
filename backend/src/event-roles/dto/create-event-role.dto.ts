import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

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
