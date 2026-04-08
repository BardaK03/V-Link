import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleCalendarToken } from './entities/google-calendar-token.entity';
import { ShiftAssignment } from '../shifts/entities/shift-assignment.entity';
import { Event } from '../events/entities/event.entity';
import { UsersModule } from '../users/users.module';
import { CalendarService } from './calendar.service';
import { GoogleCalendarService } from './google-calendar.service';
import { CalendarController } from './calendar.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([GoogleCalendarToken, ShiftAssignment, Event]),
    UsersModule,
  ],
  providers: [CalendarService, GoogleCalendarService],
  controllers: [CalendarController],
  exports: [GoogleCalendarService],
})
export class CalendarModule {}
