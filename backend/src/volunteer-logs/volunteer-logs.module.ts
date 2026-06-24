import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VolunteerLog } from './entities/volunteer-log.entity';
import { VolunteerLogsService } from './volunteer-logs.service';
import { VolunteerLogsController } from './volunteer-logs.controller';
import { GamificationModule } from '../gamification/gamification.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VolunteerLog]),
    GamificationModule,
    AuthModule,
    UsersModule,
  ],
  providers: [VolunteerLogsService],
  controllers: [VolunteerLogsController],
})
export class VolunteerLogsModule {}
