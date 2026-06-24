import { Body, Controller, Delete, Get, NotFoundException, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { UsersService } from '../users/users.service';
import { SupabaseGuard } from '../auth/supabase.guard';

interface SubscribeDto {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  @Get('vapid-public-key')
  getPublicKey() {
    return { publicKey: this.notificationsService.getPublicKey() };
  }

  @UseGuards(SupabaseGuard)
  @Post('subscribe')
  async subscribe(@Req() req: Request, @Body() body: SubscribeDto) {
    const authId = (req as any).user.id;
    const user = await this.usersService.findByAuthId(authId);
    if (!user) throw new NotFoundException('User not found');
    await this.notificationsService.subscribe(user.id, body.endpoint, body.keys);
    return { success: true };
  }

  @UseGuards(SupabaseGuard)
  @Delete('unsubscribe')
  async unsubscribe(@Req() req: Request, @Body() body: { endpoint: string }) {
    const authId = (req as any).user.id;
    const user = await this.usersService.findByAuthId(authId);
    if (!user) throw new NotFoundException('User not found');
    await this.notificationsService.unsubscribe(user.id, body.endpoint);
    return { success: true };
  }
}
