import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { UserSkill } from '../user-skills/entities/user-skill.entity';
import { Event } from '../events/entities/event.entity';
import { Application } from '../applications/entities/application.entity';
import { VolunteerLog } from '../volunteer-logs/entities/volunteer-log.entity';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSkill, Event, Application, VolunteerLog]),
    UsersModule,
    AuthModule,
  ],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
