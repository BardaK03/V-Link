import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@Controller()
@UseGuards(SupabaseGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // Volunteer applies to a role
  @Post('applications')
  @UseGuards(RoleGuard)
  @Roles(UserRole.VOLUNTEER, UserRole.ADMIN)
  apply(@Request() req: any, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.apply(req.user.id, dto);
  }

  // Volunteer sees their own applications
  @Get('applications/my')
  getMyApplications(@Request() req: any) {
    return this.applicationsService.findMyApplications(req.user.id);
  }

  // Organizer sees all applications for an event
  @Get('events/:eventId/applications')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  getEventApplications(@Param('eventId') eventId: string, @Request() req: any) {
    return this.applicationsService.findEventApplications(eventId, req.user.id);
  }

  // Organizer approves or rejects an application
  @Patch('applications/:id/status')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(id, req.user.id, dto);
  }
}
