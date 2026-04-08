import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { google } from 'googleapis';
import { GoogleCalendarToken } from './entities/google-calendar-token.entity';
import { ShiftAssignment } from '../shifts/entities/shift-assignment.entity';
import { encrypt, decrypt } from '../common/crypto.util';

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(
    @InjectRepository(GoogleCalendarToken)
    private readonly tokenRepo: Repository<GoogleCalendarToken>,
  ) {}

  private createOAuth2Client() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
  }

  getAuthUrl(state: string): string {
    const client = this.createOAuth2Client();
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      state,
    });
  }

  async handleCallback(code: string, userId: string): Promise<void> {
    const client = this.createOAuth2Client();
    const { tokens } = await client.getToken(code);

    const record: Partial<GoogleCalendarToken> = {
      user_id: userId,
      access_token_enc: encrypt(tokens.access_token!),
      refresh_token_enc: tokens.refresh_token ? encrypt(tokens.refresh_token) : '',
      expires_at: new Date(tokens.expiry_date ?? Date.now() + 3600_000),
      scope: tokens.scope ?? '',
    };

    await this.tokenRepo.upsert(record, ['user_id']);
  }

  async disconnect(userId: string): Promise<void> {
    await this.tokenRepo.delete({ user_id: userId });
  }

  async isConnected(userId: string): Promise<boolean> {
    const token = await this.tokenRepo.findOne({ where: { user_id: userId } });
    return !!token;
  }

  async upsertShiftEvent(userId: string, shift: ShiftAssignment, eventTitle: string): Promise<string | null> {
    const client = await this.getAuthorizedClient(userId);
    if (!client) return null;

    const calendar = google.calendar({ version: 'v3', auth: client });

    const start = `${shift.shift_date}T${shift.start_time}:00`;
    const end = `${shift.shift_date}T${shift.end_time}:00`;

    const resource = {
      summary: `[V-Link] ${eventTitle}`,
      description: `Tură voluntariat: ${shift.hours}h`,
      start: { dateTime: start, timeZone: 'UTC' },
      end: { dateTime: end, timeZone: 'UTC' },
    };

    try {
      if (shift.google_event_id) {
        await calendar.events.update({
          calendarId: 'primary',
          eventId: shift.google_event_id,
          requestBody: resource,
        });
        return shift.google_event_id;
      } else {
        const res = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: resource,
        });
        return res.data.id ?? null;
      }
    } catch (err: unknown) {
      this.logger.error(`Google Calendar upsert failed for user ${userId}`, err);
      return null;
    }
  }

  async deleteShiftEvent(userId: string, googleEventId: string): Promise<void> {
    const client = await this.getAuthorizedClient(userId);
    if (!client) return;

    const calendar = google.calendar({ version: 'v3', auth: client });
    try {
      await calendar.events.delete({ calendarId: 'primary', eventId: googleEventId });
    } catch (err: unknown) {
      this.logger.error(`Google Calendar delete failed for user ${userId}`, err);
    }
  }

  private async getAuthorizedClient(userId: string) {
    const token = await this.tokenRepo.findOne({ where: { user_id: userId } });
    if (!token) return null;

    const client = this.createOAuth2Client();
    client.setCredentials({
      access_token: decrypt(token.access_token_enc),
      refresh_token: token.refresh_token_enc ? decrypt(token.refresh_token_enc) : undefined,
      expiry_date: token.expires_at.getTime(),
    });

    // Handle token refresh automatically
    client.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        const updates: Partial<GoogleCalendarToken> = {
          access_token_enc: encrypt(tokens.access_token),
          expires_at: new Date(tokens.expiry_date ?? Date.now() + 3600_000),
          updated_at: new Date(),
        };
        if (tokens.refresh_token) {
          updates.refresh_token_enc = encrypt(tokens.refresh_token);
        }
        await this.tokenRepo.update({ user_id: userId }, updates);
      }
    });

    return client;
  }
}
