import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

interface RequestOrganizerBody {
  userEmail: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-organizer')
  @HttpCode(HttpStatus.OK)
  async requestOrganizer(
    @Body() body: RequestOrganizerBody,
  ): Promise<{ success: boolean }> {
    const userEmail = (body.userEmail ?? '').trim();
    if (userEmail) {
      await this.authService.sendOrganizerRequest(userEmail);
    }
    return { success: true };
  }
}
