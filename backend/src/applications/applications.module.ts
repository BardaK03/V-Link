import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './entities/application.entity';
import { EventRole } from '../event-roles/entities/event-role.entity';
import { UserSkill } from '../user-skills/entities/user-skill.entity';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { UsersModule } from '../users/users.module';
import { EventsModule } from '../events/events.module';
import { AuthModule } from '../auth/auth.module';
import { MatchingModule } from '../matching/matching.module';
import { GamificationModule } from '../gamification/gamification.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application, EventRole, UserSkill]),
    UsersModule,
    EventsModule,
    AuthModule,
    MatchingModule,
    GamificationModule,
    NotificationsModule,
  ],
  providers: [ApplicationsService],
  controllers: [ApplicationsController],
})
export class ApplicationsModule {}
