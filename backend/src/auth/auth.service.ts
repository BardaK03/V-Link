import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly resend: Resend | null;
  private readonly developerEmail = 'bardadarius6@gmail.com';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.resend = null;
      this.logger.warn(
        'RESEND_API_KEY not set — organizer request emails will not be sent',
      );
    }
  }

  async sendOrganizerRequest(userEmail: string): Promise<void> {
    const timestamp = new Date().toLocaleString('ro-RO');
    const htmlBody = `
      <p>Salut,</p>
      <p>Utilizatorul <strong>${userEmail}</strong> a solicitat un cont de Organizator pe platforma V-Link.</p>
      <p>Accesează panoul de administrare pentru a actualiza rolul acestui utilizator.</p>
      <p>Cerere trimisă la: ${timestamp}</p>
    `;

    if (!this.resend) {
      this.logger.warn(
        `[ORGANIZER REQUEST] User ${userEmail} requested organizer role at ${timestamp}. Email not sent (RESEND_API_KEY missing).`,
      );
      return;
    }

    try {
      await this.resend.emails.send({
        from: 'V-Link <onboarding@resend.dev>',
        to: [this.developerEmail],
        subject: 'Cerere cont Organizator - V-Link',
        html: htmlBody,
      });
      this.logger.log(
        `Organizer request email sent for user: ${userEmail}`,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to send organizer request email for ${userEmail}: ${message}`,
      );
    }
  }
}
