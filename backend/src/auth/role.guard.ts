import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authId: string = request['user']?.id;

    if (!authId) {
      throw new ForbiddenException('Not authenticated');
    }

    const user = await this.usersService.findByAuthId(authId);

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(`Requires role: ${requiredRoles.join(' or ')}`);
    }

    // Attach DB user to request for downstream use
    request['dbUser'] = user;

    return true;
  }
}
