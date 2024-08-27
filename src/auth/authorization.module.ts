import { DynamicModule, Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt.guard';
import { ServiceStrategy } from './strategies/service.strategy';
import { ServiceAuthGuard } from './guards/service.guard';
import { RoleGuard } from './guards/role.guard';
import { UserGuard } from './guards/user.guard';
import { AuthorizationAsyncOptions } from './authorization.config';
import { AuthorizationService } from './authorization.service';

@Global()
@Module({})
export class AuthorizationModule {
  static forRootAsync(options: AuthorizationAsyncOptions): DynamicModule {
    const { useFactory, inject } = options;
    return {
      module: AuthorizationModule,
      imports: [
        HttpModule,
        CacheModule.register(),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        ...(options.imports || []),
      ],
      providers: [
        {
          provide: 'CLIENTS',
          useFactory,
          inject,
        },
        JwtStrategy,
        JwtAuthGuard,
        ServiceStrategy,
        ServiceAuthGuard,
        RoleGuard,
        UserGuard,
        AuthorizationService,
      ],
      exports: [
        JwtStrategy,
        JwtAuthGuard,
        ServiceStrategy,
        ServiceAuthGuard,
        RoleGuard,
        UserGuard,
        AuthorizationService,
        PassportModule,
      ],
    };
  }
}
