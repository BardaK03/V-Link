import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { VolunteerLogsService } from './volunteer-logs.service';
import { CreateVolunteerLogDto } from './dto/create-volunteer-log.dto';

@Controller('volunteer-logs')
@UseGuards(SupabaseGuard)
export class VolunteerLogsController {
  constructor(private readonly volunteerLogsService: VolunteerLogsService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  create(@Body() dto: CreateVolunteerLogDto) {
    return this.volunteerLogsService.create(dto);
  }
}
