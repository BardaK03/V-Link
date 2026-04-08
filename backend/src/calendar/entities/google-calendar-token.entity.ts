import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('google_calendar_tokens')
export class GoogleCalendarToken {
  @PrimaryColumn('uuid')
  user_id: string;

  @Column({ type: 'text' })
  access_token_enc: string;

  @Column({ type: 'text' })
  refresh_token_enc: string;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ type: 'text', default: '' })
  scope: string;

  @Column({ nullable: true })
  calendar_id: string | null;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  updated_at: Date;
}
