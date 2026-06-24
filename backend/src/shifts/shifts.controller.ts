import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { AutoSplitDto } from './dto/auto-split.dto';

@Controller()
@UseGuards(SupabaseGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get('events/:eventId/shifts')
  listByEvent(@Param('eventId') eventId: string, @Request() req: any) {
    return this.shiftsService.listByEvent(eventId, req.user.id);
  }

  @Post('events/:eventId/shifts/auto-split')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  autoSplit(
    @Param('eventId') eventId: string,
    @Body() dto: AutoSplitDto,
    @Request() req: any,
  ) {
    return this.shiftsService.autoSplit(eventId, dto, req.user.id);
  }

  @Post('events/:eventId/shifts')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  create(
    @Param('eventId') eventId: string,
    @Body() dto: CreateShiftDto,
    @Request() req: any,
  ) {
    return this.shiftsService.create(eventId, dto, req.user.id);
  }

  @Get('shifts/mine')
  findMine(
    @Request() req: any,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const today = new Date().toISOString().slice(0, 10);
    const defaultTo = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    return this.shiftsService.findMine(req.user.id, from ?? today, to ?? defaultTo);
  }

  @Patch('shifts/:id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
    @Request() req: any,
  ) {
    return this.shiftsService.update(id, dto, req.user.id);
  }

  @Delete('shifts/:id')
  @UseGuards(RoleGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.shiftsService.remove(id, req.user.id);
  }
}
