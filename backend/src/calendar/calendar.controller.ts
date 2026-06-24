import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard';
import { CalendarService } from './calendar.service';

@Controller('calendar')
@UseGuards(SupabaseGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('me')
  async getMyCalendar(
    @Request() req: any,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const today = new Date().toISOString().slice(0, 10);
    const defaultTo = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    return this.calendarService.getMyCalendar(
      req.user.id,
      from ?? today,
      to ?? defaultTo,
    );
  }
}
