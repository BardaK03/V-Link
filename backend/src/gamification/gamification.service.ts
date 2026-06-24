import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Badge } from '../badges/entities/badge.entity';
import { UserBadge } from '../user-badges/entities/user-badge.entity';
import { PointTransaction } from '../point-transactions/entities/point-transaction.entity';
import { Application, ApplicationStatus } from '../applications/entities/application.entity';
import { VolunteerLog } from '../volunteer-logs/entities/volunteer-log.entity';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  email: string;
  total_points: number;
  badge_count: number;
}

export interface UserStats {
  total_points: number;
  total_hours: number;
  events_completed: number;
  badges: Array<{ id: number; name: string; description: string; awarded_at: Date }>;
  recent_transactions: Array<{ amount: number; description: string; created_at: Date }>;
}

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Badge)
    private readonly badgeRepo: Repository<Badge>,
    @InjectRepository(UserBadge)
    private readonly userBadgeRepo: Repository<UserBadge>,
    @InjectRepository(PointTransaction)
    private readonly txRepo: Repository<PointTransaction>,
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
    @InjectRepository(VolunteerLog)
    private readonly logRepo: Repository<VolunteerLog>,
    private readonly dataSource: DataSource,
  ) {}

  async awardPoints(userId: string, amount: number, description: string): Promise<void> {
    await this.dataSource.transaction(async (em) => {
      await em.insert(PointTransaction, { user_id: userId, amount, description });
      await em
        .createQueryBuilder()
        .update(User)
        .set({ total_points: () => `total_points + ${amount}` })
        .where('id = :userId', { userId })
        .execute();
    });
    this.logger.log(`Awarded ${amount} pts to user ${userId}: ${description}`);
  }

  async checkAndAwardBadges(userId: string): Promise<void> {
    const allBadges = await this.badgeRepo.find();
    const owned = await this.userBadgeRepo.find({ where: { user_id: userId } });
    const ownedIds = new Set(owned.map((ub) => ub.badge_id));

    const unearned = allBadges.filter((b) => !ownedIds.has(b.id));
    if (unearned.length === 0) return;

    // Count completed applications
    const completedCount = await this.appRepo.count({
      where: { user_id: userId, status: ApplicationStatus.COMPLETED },
    });

    // Sum volunteer hours
    const hoursResult = await this.logRepo
      .createQueryBuilder('vl')
      .select('COALESCE(SUM(vl.hours_worked), 0)', 'total')
      .where('vl.user_id = :userId', { userId })
      .getRawOne<{ total: string }>();
    const totalHours = parseFloat(hoursResult?.total ?? '0');

    for (const badge of unearned) {
      let earned = false;
      if (badge.action_trigger === 'FIRST_EVENT' && completedCount >= 1) earned = true;
      if (badge.action_trigger === 'FIVE_EVENTS' && completedCount >= 5) earned = true;
      if (badge.action_trigger === 'TEN_HOURS' && totalHours >= 10) earned = true;

      if (earned) {
        await this.userBadgeRepo.save({ user_id: userId, badge_id: badge.id });
        this.logger.log(`Badge "${badge.name}" awarded to user ${userId}`);
      }
    }
  }

  async getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
    const rows = await this.userRepo
      .createQueryBuilder('u')
      .leftJoin('user_badges', 'ub', 'ub.user_id = u.id')
      .select('u.id', 'user_id')
      .addSelect('u.email', 'email')
      .addSelect('u.total_points', 'total_points')
      .addSelect('COUNT(ub.badge_id)', 'badge_count')
      .groupBy('u.id')
      .orderBy('u.total_points', 'DESC')
      .limit(limit)
      .getRawMany<{ user_id: string; email: string; total_points: number; badge_count: string }>();

    return rows.map((r, i) => ({
      rank: i + 1,
      user_id: r.user_id,
      email: r.email,
      total_points: Number(r.total_points),
      badge_count: Number(r.badge_count),
    }));
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });

    const eventsCompleted = await this.appRepo.count({
      where: { user_id: userId, status: ApplicationStatus.COMPLETED },
    });

    const hoursResult = await this.logRepo
      .createQueryBuilder('vl')
      .select('COALESCE(SUM(vl.hours_worked), 0)', 'total')
      .where('vl.user_id = :userId', { userId })
      .getRawOne<{ total: string }>();

    const userBadges = await this.userBadgeRepo.find({
      where: { user_id: userId },
      relations: ['badge'],
      order: { awarded_at: 'DESC' },
    });

    const recentTx = await this.txRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: 10,
    });

    return {
      total_points: user.total_points,
      total_hours: parseFloat(hoursResult?.total ?? '0'),
      events_completed: eventsCompleted,
      badges: userBadges.map((ub) => ({
        id: ub.badge.id,
        name: ub.badge.name,
        description: ub.badge.description,
        awarded_at: ub.awarded_at,
      })),
      recent_transactions: recentTx.map((t) => ({
        amount: t.amount,
        description: t.description,
        created_at: t.created_at,
      })),
    };
  }
}
