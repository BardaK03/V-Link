import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { EventRole } from '../event-roles/entities/event-role.entity';
import { UsersService } from '../users/users.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventRole)
    private readonly roleRepo: Repository<EventRole>,
    private readonly usersService: UsersService,
  ) {}

  async create(authId: string, dto: CreateEventDto): Promise<Event> {
    const user = await this.usersService.findByAuthId(authId);
    if (!user) throw new NotFoundException('User not found');

    const event = this.eventRepo.create({
      organizer_id: user.id,
      title: dto.title,
      description: dto.description,
      address: dto.address,
      start_date: new Date(dto.start_date),
      end_date: new Date(dto.end_date),
      registration_deadline: dto.registration_deadline ? new Date(dto.registration_deadline) : null,
      registration_status: 'OPEN',
    });

    const saved = await this.eventRepo.save(event);

    if (dto.roles && dto.roles.length > 0) {
      const roles = dto.roles.map((r) =>
        this.roleRepo.create({
          event_id: saved.id,
          role_name: r.role_name,
          description: r.description,
          slots_needed: r.slots_needed,
          hours_required: r.hours_required,
          points_reward: r.points_reward,
          required_skills: r.required_skills ?? [],
        }),
      );
      await this.roleRepo.save(roles);
    }

    return this.findOne(saved.id);
  }

  async findAll(): Promise<Event[]> {
    return this.eventRepo.find({
      relations: ['organizer', 'roles'],
      order: { start_date: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: ['organizer', 'roles'],
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async update(id: string, authId: string, dto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);
    await this.assertOwner(event, authId);

    if (new Date(event.start_date) <= new Date()) {
      throw new ForbiddenException('Nu poți edita un eveniment care a început sau s-a finalizat');
    }

    const updated = Object.assign({}, event, {
      title: dto.title ?? event.title,
      description: dto.description ?? event.description,
      address: dto.address ?? event.address,
      start_date: dto.start_date ? new Date(dto.start_date) : event.start_date,
      end_date: dto.end_date ? new Date(dto.end_date) : event.end_date,
      registration_deadline:
        dto.registration_deadline !== undefined
          ? dto.registration_deadline
            ? new Date(dto.registration_deadline)
            : null
          : event.registration_deadline,
    });

    await this.eventRepo.save(updated);
    return this.findOne(id);
  }

  async remove(id: string, authId: string): Promise<void> {
    const event = await this.findOne(id);
    await this.assertOwner(event, authId);

    if (new Date(event.start_date) <= new Date()) {
      throw new ForbiddenException('Nu poți șterge un eveniment care a început sau s-a finalizat');
    }

    await this.eventRepo.delete(id);
  }

  async markCompleted(id: string, authId: string): Promise<Event> {
    const event = await this.findOne(id);
    await this.assertOwner(event, authId);

    if (event.status === 'COMPLETED') {
      return event;
    }

    const updated = Object.assign({}, event, { status: 'COMPLETED' as const });
    await this.eventRepo.save(updated);
    return this.findOne(id);
  }

  async closeRegistration(id: string, authId: string): Promise<Event> {
    const event = await this.findOne(id);
    await this.assertOwner(event, authId);
    const updated = Object.assign({}, event, { registration_status: 'CLOSED' as const });
    await this.eventRepo.save(updated);
    return this.findOne(id);
  }

  async openRegistration(id: string, authId: string): Promise<Event> {
    const event = await this.findOne(id);
    await this.assertOwner(event, authId);
    if (
      event.registration_deadline &&
      new Date(event.registration_deadline) < new Date()
    ) {
      throw new ForbiddenException('Deadline-ul de înscriere a trecut; nu poți redeschide.');
    }
    const updated = Object.assign({}, event, { registration_status: 'OPEN' as const });
    await this.eventRepo.save(updated);
    return this.findOne(id);
  }

  async findByOrganizer(organizerId: string): Promise<Event[]> {
    return this.eventRepo.find({
      where: { organizer_id: organizerId },
      relations: ['roles'],
      order: { start_date: 'DESC' },
    });
  }

  private async assertOwner(event: Event, authId: string): Promise<void> {
    const user = await this.usersService.findByAuthId(authId);
    if (!user || event.organizer_id !== user.id) {
      throw new ForbiddenException('Only the event organizer can perform this action');
    }
  }
}
