import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Role, RequestWithUser } from '../types';

interface UserParams {
  userId: string;
}
@Injectable()
export class UserGuard implements CanActivate {
  constructor() {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user; // User object set by Passport after validation

    const hasRole =
      user &&
      user.roles &&
      user.roles.some((role: Role) => role === Role.PLYMOUTH_ADMIN);

    if (hasRole) {
      return true;
    }

    // Assuming your route might look something like: /users/:userId/some-resource
    const paramUserId = request.params as UserParams;

    // Check if user is accessing their own resource or is an admin
    if (user.userId !== paramUserId?.userId) {
      throw new ForbiddenException();
    }

    return true;
  }
}
