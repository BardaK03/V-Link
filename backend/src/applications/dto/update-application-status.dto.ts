import { IsEnum } from 'class-validator';
import { ApplicationStatus } from '../entities/application.entity';

export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus.APPROVED | ApplicationStatus.REJECTED | ApplicationStatus.COMPLETED;
}
