import {
  Controller,
  Delete,
  Get,
  Query,
  Redirect,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard';
import { CalendarService } from './calendar.service';
import { GoogleCalendarService } from './google-calendar.service';
import { UsersService } from '../users/users.service';

@Controller('calendar')
@UseGuards(SupabaseGuard)
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly usersService: UsersService,
  ) {}

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

  @Get('google/status')
  async googleStatus(@Request() req: any) {
    const connected = await this.googleCalendarService.isConnected(req.user.id);
    return { connected };
  }

  @Get('google/connect')
  @Redirect()
  async googleConnect(@Request() req: any) {
    const user = await this.usersService.findByAuthId(req.user.id);
    if (!user) return { url: `${process.env.FRONTEND_URL}/calendar` };
    const state = Buffer.from(user.id).toString('base64url');
    const url = this.googleCalendarService.getAuthUrl(state);
    return { url };
  }

  @Get('google/callback')
  @Redirect()
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    try {
      const userId = Buffer.from(state, 'base64url').toString('utf8');
      await this.googleCalendarService.handleCallback(code, userId);
    } catch {
      return { url: `${process.env.FRONTEND_URL}/calendar?google=error` };
    }
    return { url: `${process.env.FRONTEND_URL}/calendar?google=connected` };
  }

  @Delete('google/disconnect')
  async googleDisconnect(@Request() req: any) {
    const user = await this.usersService.findByAuthId(req.user.id);
    if (user) {
      await this.googleCalendarService.disconnect(user.id);
    }
    return { disconnected: true };
  }
}
