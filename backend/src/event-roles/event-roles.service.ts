import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventRole } from './entities/event-role.entity';
import { EventsService } from '../events/events.service';
import { UsersService } from '../users/users.service';
import { CreateEventRoleDto } from './dto/create-event-role.dto';
import { UpdateEventRoleDto } from './dto/update-event-role.dto';

@Injectable()
export class EventRolesService {
  constructor(
    @InjectRepository(EventRole)
    private readonly roleRepo: Repository<EventRole>,
    private readonly eventsService: EventsService,
    private readonly usersService: UsersService,
  ) {}

  async addRole(eventId: string, authId: string, dto: CreateEventRoleDto): Promise<EventRole> {
    const event = await this.eventsService.findOne(eventId);
    await this.assertOwner(event.organizer_id, authId);

    const role = this.roleRepo.create({
      event_id: eventId,
      role_name: dto.role_name,
      description: dto.description,
      slots_needed: dto.slots_needed,
      hours_required: dto.hours_required,
      points_reward: dto.points_reward,
      required_skills: dto.required_skills ?? [],
    });

    return this.roleRepo.save(role);
  }

  async removeRole(eventId: string, roleId: string, authId: string): Promise<void> {
    const event = await this.eventsService.findOne(eventId);
    await this.assertOwner(event.organizer_id, authId);

    const role = await this.roleRepo.findOne({ where: { id: roleId, event_id: eventId } });
    if (!role) throw new NotFoundException('Role not found');

    await this.roleRepo.delete(roleId);
  }

  async updateRole(
    eventId: string,
    roleId: string,
    authId: string,
    dto: UpdateEventRoleDto,
  ): Promise<EventRole> {
    const event = await this.eventsService.findOne(eventId);
    await this.assertOwner(event.organizer_id, authId);

    if (new Date(event.start_date) <= new Date()) {
      throw new ForbiddenException('Nu poți edita roluri pentru un eveniment care a început sau s-a finalizat');
    }

    const role = await this.roleRepo.findOne({ where: { id: roleId, event_id: eventId } });
    if (!role) throw new NotFoundException('Role not found');

    const updated = {
      ...role,
      role_name: dto.role_name ?? role.role_name,
      description: dto.description !== undefined ? dto.description : role.description,
      slots_needed: dto.slots_needed ?? role.slots_needed,
      hours_required: dto.hours_required ?? role.hours_required,
      points_reward: dto.points_reward ?? role.points_reward,
      required_skills: dto.required_skills ?? role.required_skills,
    };

    return this.roleRepo.save(updated);
  }

  private async assertOwner(organizerId: string, authId: string): Promise<void> {
    const user = await this.usersService.findByAuthId(authId);
    if (!user || organizerId !== user.id) {
      throw new ForbiddenException('Only the event organizer can perform this action');
    }
  }
}
