import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VolunteerLog } from './entities/volunteer-log.entity';
import { GamificationService } from '../gamification/gamification.service';
import { CreateVolunteerLogDto } from './dto/create-volunteer-log.dto';

@Injectable()
export class VolunteerLogsService {
  constructor(
    @InjectRepository(VolunteerLog)
    private readonly logRepo: Repository<VolunteerLog>,
    private readonly gamificationService: GamificationService,
  ) {}

  async create(dto: CreateVolunteerLogDto): Promise<VolunteerLog> {
    const pointsEarned = Math.round(dto.hours_worked * 10);

    const log = this.logRepo.create({
      user_id: dto.user_id,
      event_id: dto.event_id,
      hours_worked: dto.hours_worked,
      points_earned: pointsEarned,
    });

    const saved = await this.logRepo.save(log) as VolunteerLog;

    // Award points + check badges
    await this.gamificationService.awardPoints(
      dto.user_id,
      pointsEarned,
      `${dto.hours_worked}h voluntariat`,
    );
    await this.gamificationService.checkAndAwardBadges(dto.user_id);

    return saved;
  }
}
