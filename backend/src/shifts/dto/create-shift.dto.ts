import { IsString, IsUUID, IsNotEmpty, IsNumber, Min, Matches } from 'class-validator';

export class CreateShiftDto {
  @IsUUID()
  application_id: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'shift_date must be YYYY-MM-DD' })
  shift_date: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'start_time must be HH:MM' })
  start_time: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'end_time must be HH:MM' })
  end_time: string;

  @IsNumber()
  @Min(0.25)
  hours: number;
}
