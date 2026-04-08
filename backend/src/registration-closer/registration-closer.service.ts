import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Event } from '../events/entities/event.entity';

@Injectable()
export class RegistrationCloserService {
  private readonly logger = new Logger(RegistrationCloserService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async closeExpiredRegistrations(): Promise<void> {
    const result = await this.eventRepo
      .createQueryBuilder()
      .update(Event)
      .set({ registration_status: 'CLOSED' })
      .where('registration_status = :status', { status: 'OPEN' })
      .andWhere('registration_deadline IS NOT NULL')
      .andWhere('registration_deadline < NOW()')
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(`Auto-closed registrations for ${result.affected} event(s)`);
    }
  }
}
