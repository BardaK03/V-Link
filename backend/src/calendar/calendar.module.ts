import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShiftAssignment } from '../shifts/entities/shift-assignment.entity';
import { Event } from '../events/entities/event.entity';
import { UsersModule } from '../users/users.module';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShiftAssignment, Event]),
    UsersModule,
  ],
  providers: [CalendarService],
  controllers: [CalendarController],
})
export class CalendarModule {}
