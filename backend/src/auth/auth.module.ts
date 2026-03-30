import { Module } from '@nestjs/common';
import { SupabaseGuard } from './supabase.guard';
import { RoleGuard } from './role.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [SupabaseGuard, RoleGuard],
  exports: [SupabaseGuard, RoleGuard],
})
export class AuthModule {}
