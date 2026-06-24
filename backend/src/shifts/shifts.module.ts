import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShiftAssignment } from './entities/shift-assignment.entity';
import { Application } from '../applications/entities/application.entity';
import { EventRole } from '../event-roles/entities/event-role.entity';
import { Event } from '../events/entities/event.entity';
import { UsersModule } from '../users/users.module';
import { ShiftsService } from './shifts.service';
import { ShiftsController } from './shifts.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShiftAssignment, Application, EventRole, Event]),
    UsersModule,
  ],
  providers: [ShiftsService],
  controllers: [ShiftsController],
  exports: [ShiftsService],
})
export class ShiftsModule {}
