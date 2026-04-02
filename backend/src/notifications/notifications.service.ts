import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PushSubscription } from './entities/push-subscription.entity';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private vapidConfigured = false;

  constructor(
    @InjectRepository(PushSubscription)
    private readonly subRepo: Repository<PushSubscription>,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const email = this.configService.get<string>('VAPID_EMAIL');

    if (publicKey && privateKey && email) {
      webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
      this.vapidConfigured = true;
    } else {
      this.logger.warn('VAPID keys not configured — push notifications disabled');
    }
  }

  getPublicKey(): string | null {
    return this.configService.get<string>('VAPID_PUBLIC_KEY') ?? null;
  }

  async subscribe(
    userId: string,
    endpoint: string,
    keys: { p256dh: string; auth: string },
  ): Promise<void> {
    const existing = await this.subRepo.findOne({ where: { endpoint } });
    if (existing) {
      await this.subRepo.update(existing.id, { user_id: userId, keys });
    } else {
      await this.subRepo.save({ user_id: userId, endpoint, keys });
    }
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.subRepo.delete({ user_id: userId, endpoint });
  }

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    url?: string,
  ): Promise<void> {
    if (!this.vapidConfigured) return;

    const subscriptions = await this.subRepo.find({ where: { user_id: userId } });
    const payload = JSON.stringify({ title, body, url: url ?? '/my-applications' });

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            payload,
          );
        } catch (err: unknown) {
          // 410 Gone = subscription expired, remove it
          if ((err as any)?.statusCode === 410) {
            await this.subRepo.delete(sub.id);
          } else {
            this.logger.error(`Push failed for ${sub.endpoint}`, err);
          }
        }
      }),
    );
  }
}
