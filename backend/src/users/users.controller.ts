import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { SupabaseGuard } from '../auth/supabase.guard';

@UseGuards(SupabaseGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: Request) {
    const authId = (req as any).user.id;
    return this.usersService.findByAuthId(authId);
  }

  @Patch('me/social-links')
  async updateSocialLinks(
    @Req() req: Request,
    @Body() body: { social_links: Record<string, string> },
  ) {
    const authId = (req as any).user.id;
    return this.usersService.updateSocialLinks(authId, body.social_links);
  }

  @Get('me/skills')
  async getSkills(@Req() req: Request) {
    const authId = (req as any).user.id;
    return this.usersService.getSkills(authId);
  }

  @Post('me/skills')
  async addSkill(
    @Req() req: Request,
    @Body() body: { skill_id: number },
  ) {
    const authId = (req as any).user.id;
    await this.usersService.addSkill(authId, body.skill_id);
    return this.usersService.getSkills(authId);
  }

  @Delete('me/skills/:skillId')
  async removeSkill(
    @Req() req: Request,
    @Param('skillId', ParseIntPipe) skillId: number,
  ) {
    const authId = (req as any).user.id;
    await this.usersService.removeSkill(authId, skillId);
    return this.usersService.getSkills(authId);
  }
}
