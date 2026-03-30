import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Badge } from '../badges/entities/badge.entity';
import { UserBadge } from '../user-badges/entities/user-badge.entity';
import { PointTransaction } from '../point-transactions/entities/point-transaction.entity';
import { Application } from '../applications/entities/application.entity';
import { VolunteerLog } from '../volunteer-logs/entities/volunteer-log.entity';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Badge, UserBadge, PointTransaction, Application, VolunteerLog]),
    UsersModule,
    AuthModule,
  ],
  providers: [GamificationService],
  controllers: [GamificationController],
  exports: [GamificationService],
})
export class GamificationModule {}
