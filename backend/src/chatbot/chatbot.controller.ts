import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard';
import { ChatbotService } from './chatbot.service';
import { ChatMessageDto } from './dto/chat-message.dto';

@Controller('chatbot')
@UseGuards(SupabaseGuard)
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('chat')
  async chat(@Request() req: any, @Body() dto: ChatMessageDto) {
    const reply = await this.chatbotService.chat(req.user.id, dto.message, dto.history);
    return { reply };
  }
}
