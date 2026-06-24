import { Body, Controller, Delete, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { EventRolesService } from './event-roles.service';
import { CreateEventRoleDto } from './dto/create-event-role.dto';
import { UpdateEventRoleDto } from './dto/update-event-role.dto';

@Controller('events/:eventId/roles')
@UseGuards(SupabaseGuard, RoleGuard)
@Roles(UserRole.ORGANIZER, UserRole.ADMIN)
export class EventRolesController {
  constructor(private readonly eventRolesService: EventRolesService) {}

  @Post()
  addRole(
    @Param('eventId') eventId: string,
    @Request() req: any,
    @Body() dto: CreateEventRoleDto,
  ) {
    return this.eventRolesService.addRole(eventId, req.user.id, dto);
  }

  @Patch(':roleId')
  updateRole(
    @Param('eventId') eventId: string,
    @Param('roleId') roleId: string,
    @Request() req: any,
    @Body() dto: UpdateEventRoleDto,
  ) {
    return this.eventRolesService.updateRole(eventId, roleId, req.user.id, dto);
  }

  @Delete(':roleId')
  removeRole(
    @Param('eventId') eventId: string,
    @Param('roleId') roleId: string,
    @Request() req: any,
  ) {
    return this.eventRolesService.removeRole(eventId, roleId, req.user.id);
  }
}
