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
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { SupabaseGuard } from '../auth/supabase.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

  @Patch('me/profile')
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const authId = (req as any).user.id;
    return this.usersService.updateProfile(authId, dto);
  }

  @Get(':id/profile')
  async getPublicProfile(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      display_name: user.display_name,
      company_name: user.company_name,
      avatar_url: user.avatar_url,
      social_links: user.social_links,
      created_at: user.created_at,
    };
  }
}
