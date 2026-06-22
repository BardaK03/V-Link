import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftAssignment } from '../shifts/entities/shift-assignment.entity';
import { Event } from '../events/entities/event.entity';
import { UsersService } from '../users/users.service';

export interface CalendarEntry {
  id: string
  type: 'shift' | 'event'
  title: string
  date: string        // YYYY-MM-DD
  start_time: string  // HH:MM
  end_time: string    // HH:MM
  hours: number
  event_id: string
  event_title: string
  role_name?: string
}

/** Normalize a Postgres `time` value (HH:MM:SS) to HH:MM. */
function toHourMinute(time: string): string {
  return time.slice(0, 5);
}

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(ShiftAssignment)
    private readonly shiftRepo: Repository<ShiftAssignment>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    private readonly usersService: UsersService,
  ) {}

  async getMyCalendar(authId: string, from: string, to: string): Promise<CalendarEntry[]> {
    const user = await this.usersService.findByAuthId(authId);
    if (!user) throw new NotFoundException('User not found');

    const shifts = await this.shiftRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.event', 'event')
      .leftJoinAndSelect('s.role', 'role')
      .where('s.user_id = :userId', { userId: user.id })
      .andWhere('s.shift_date >= :from', { from })
      .andWhere('s.shift_date <= :to', { to })
      .orderBy('s.shift_date', 'ASC')
      .addOrderBy('s.start_time', 'ASC')
      .getMany();

    return shifts.map((s): CalendarEntry => ({
      id: s.id,
      type: 'shift',
      title: `${s.role?.role_name ?? 'Tură'} — ${s.event?.title ?? 'Eveniment'}`,
      date: s.shift_date,
      // Postgres `time` columns come back as HH:MM:SS — trim to the HH:MM
      // shape the CalendarEntry contract documents and the frontend expects.
      start_time: toHourMinute(s.start_time),
      end_time: toHourMinute(s.end_time),
      hours: s.hours,
      event_id: s.event_id,
      event_title: s.event?.title ?? '',
      role_name: s.role?.role_name,
    }));
  }
}
