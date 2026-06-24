import { IsString, IsNumber, IsOptional, Min, Matches } from 'class-validator';

export class UpdateShiftDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'shift_date must be YYYY-MM-DD' })
  shift_date?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'start_time must be HH:MM' })
  start_time?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'end_time must be HH:MM' })
  end_time?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.25)
  hours?: number;
}
