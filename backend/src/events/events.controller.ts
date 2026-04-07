import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Controller('events')
@UseGuards(SupabaseGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  create(@Request() req: any, @Body() dto: CreateEventDto) {
    return this.eventsService.create(req.user.id, dto);
  }

  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @Get('by-organizer/:organizerId')
  findByOrganizer(@Param('organizerId') organizerId: string) {
    return this.eventsService.findByOrganizer(organizerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, req.user.id, dto);
  }

  @Patch(':id/complete')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  markCompleted(@Param('id') id: string, @Request() req: any) {
    return this.eventsService.markCompleted(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.eventsService.remove(id, req.user.id);
  }
}
