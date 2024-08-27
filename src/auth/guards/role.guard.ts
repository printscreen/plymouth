import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RoleGuard implements CanActivate {
  private reflector: Reflector;
  constructor() {
    this.reflector = new Reflector();
  }

  canActivate(context: ExecutionContext): boolean {
    // Retrieve the roles metadata set on the handler (route) or class (controller)
    const requiredRoles =
      this.reflector.get<string[]>('roles', context.getHandler()) ||
      this.reflector.get<string[]>('roles', context.getClass());

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const hasRole =
      user &&
      user?.roles &&
      user?.roles.some((role: string) => requiredRoles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException();
    }

    return true;
  }
}
