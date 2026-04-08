import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftAssignment } from './entities/shift-assignment.entity';
import { Application, ApplicationStatus } from '../applications/entities/application.entity';
import { EventRole } from '../event-roles/entities/event-role.entity';
import { Event } from '../events/entities/event.entity';
import { UsersService } from '../users/users.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { AutoSplitDto } from './dto/auto-split.dto';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(ShiftAssignment)
    private readonly shiftRepo: Repository<ShiftAssignment>,
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
    @InjectRepository(EventRole)
    private readonly roleRepo: Repository<EventRole>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    private readonly usersService: UsersService,
  ) {}

  async listByEvent(eventId: string, authId: string): Promise<ShiftAssignment[]> {
    // Any approved volunteer of the event or the organizer can view shifts
    await this.findEventOrThrow(eventId);
    return this.shiftRepo.find({
      where: { event_id: eventId },
      relations: ['user', 'role'],
      order: { shift_date: 'ASC', start_time: 'ASC' },
    });
  }

  async findMine(
    authId: string,
    from: string,
    to: string,
  ): Promise<ShiftAssignment[]> {
    const user = await this.usersService.findByAuthId(authId);
    if (!user) throw new NotFoundException('User not found');

    return this.shiftRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.event', 'event')
      .leftJoinAndSelect('s.role', 'role')
      .where('s.user_id = :userId', { userId: user.id })
      .andWhere('s.shift_date >= :from', { from })
      .andWhere('s.shift_date <= :to', { to })
      .orderBy('s.shift_date', 'ASC')
      .addOrderBy('s.start_time', 'ASC')
      .getMany();
  }

  async autoSplit(
    eventId: string,
    dto: AutoSplitDto,
    authId: string,
  ): Promise<ShiftAssignment[]> {
    const event = await this.findEventOrThrow(eventId);
    await this.assertOwner(event, authId);

    const role = await this.roleRepo.findOne({ where: { id: dto.role_id } });
    if (!role || role.event_id !== eventId) {
      throw new NotFoundException('Role not found in this event');
    }

    const approvedApps = await this.appRepo.find({
      where: { role_id: dto.role_id, status: ApplicationStatus.APPROVED },
    });
    if (approvedApps.length === 0) {
      return [];
    }

    const days = this.getEventDays(event.start_date, event.end_date);
    if (days.length === 0) return [];

    const hoursPerDay = this.splitHoursEqually(role.hours_required, days.length);

    // Remove existing auto-generated shifts for this role first
    await this.shiftRepo
      .createQueryBuilder()
      .delete()
      .from(ShiftAssignment)
      .where('role_id = :roleId', { roleId: dto.role_id })
      .execute();

    const toInsert: Partial<ShiftAssignment>[] = [];
    for (const app of approvedApps) {
      days.forEach((day, i) => {
        const h = hoursPerDay[i];
        toInsert.push({
          application_id: app.id,
          role_id: role.id,
          user_id: app.user_id,
          event_id: eventId,
          shift_date: day,
          start_time: '09:00',
          end_time: this.addHours('09:00', h),
          hours: h,
        });
      });
    }

    const entities = this.shiftRepo.create(toInsert);
    await this.shiftRepo.save(entities);

    return this.listByEvent(eventId, authId);
  }

  async create(
    eventId: string,
    dto: CreateShiftDto,
    authId: string,
  ): Promise<ShiftAssignment> {
    const event = await this.findEventOrThrow(eventId);
    await this.assertOwner(event, authId);

    const app = await this.appRepo.findOne({ where: { id: dto.application_id } });
    if (!app) throw new NotFoundException('Application not found');

    const entity = this.shiftRepo.create({
      application_id: dto.application_id,
      role_id: app.role_id,
      user_id: app.user_id,
      event_id: eventId,
      shift_date: dto.shift_date,
      start_time: dto.start_time,
      end_time: dto.end_time,
      hours: dto.hours,
    });

    return this.shiftRepo.save(entity);
  }

  async update(
    shiftId: string,
    dto: UpdateShiftDto,
    authId: string,
  ): Promise<ShiftAssignment> {
    const shift = await this.findShiftOrThrow(shiftId);
    const event = await this.findEventOrThrow(shift.event_id);
    await this.assertOwner(event, authId);

    const updated = Object.assign({}, shift, {
      shift_date: dto.shift_date ?? shift.shift_date,
      start_time: dto.start_time ?? shift.start_time,
      end_time: dto.end_time ?? shift.end_time,
      hours: dto.hours ?? shift.hours,
    });

    return this.shiftRepo.save(updated);
  }

  async remove(shiftId: string, authId: string): Promise<void> {
    const shift = await this.findShiftOrThrow(shiftId);
    const event = await this.findEventOrThrow(shift.event_id);
    await this.assertOwner(event, authId);
    await this.shiftRepo.delete(shiftId);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private async findEventOrThrow(eventId: string): Promise<Event> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  private async findShiftOrThrow(shiftId: string): Promise<ShiftAssignment> {
    const shift = await this.shiftRepo.findOne({ where: { id: shiftId } });
    if (!shift) throw new NotFoundException('Shift not found');
    return shift;
  }

  private async assertOwner(event: Event, authId: string): Promise<void> {
    const user = await this.usersService.findByAuthId(authId);
    if (!user || event.organizer_id !== user.id) {
      throw new ForbiddenException('Only the event organizer can manage shifts');
    }
  }

  /** Generate every date string (YYYY-MM-DD) from start to end inclusive */
  private getEventDays(start: Date | string, end: Date | string): string[] {
    const days: string[] = [];
    const cur = new Date(start);
    const last = new Date(end);
    cur.setUTCHours(0, 0, 0, 0);
    last.setUTCHours(0, 0, 0, 0);

    while (cur <= last) {
      days.push(cur.toISOString().slice(0, 10));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return days;
  }

  /** Distribute totalHours across n days; last day gets the remainder */
  splitHoursEqually(totalHours: number, days: number): number[] {
    if (days <= 0) return [];
    const base = Math.floor((totalHours / days) * 4) / 4; // round down to nearest 0.25
    const remainder = Math.round((totalHours - base * days) * 100) / 100;
    const result = Array(days).fill(base);
    result[days - 1] = Math.round((result[days - 1] + remainder) * 100) / 100;
    return result;
  }

  /** Add fractional hours to a HH:MM string → HH:MM */
  private addHours(time: string, hours: number): string {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + Math.round(hours * 60);
    const newH = Math.min(Math.floor(totalMinutes / 60), 23);
    const newM = totalMinutes % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  }
}
