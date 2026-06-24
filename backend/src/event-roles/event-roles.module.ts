import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventRole } from './entities/event-role.entity';
import { EventRolesService } from './event-roles.service';
import { EventRolesController } from './event-roles.controller';
import { EventsModule } from '../events/events.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([EventRole]), EventsModule, UsersModule, AuthModule],
  providers: [EventRolesService],
  controllers: [EventRolesController],
})
export class EventRolesModule {}
