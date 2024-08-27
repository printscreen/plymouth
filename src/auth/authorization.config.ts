import { ModuleMetadata, Type } from '@nestjs/common';

export interface AuthorizationOptions {
  useClass: Type<AuthorizationOptionsFactory>;
}

export interface AuthorizationAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useClass?: Type<AuthorizationOptionsFactory>;
  useExisting?: Type<AuthorizationOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<AuthorizationConfigOptions> | AuthorizationConfigOptions;
  inject?: any[];
}

export interface AuthorizationOptionsFactory {
  createAuthorizationOptions():
    | Promise<AuthorizationConfigOptions>
    | AuthorizationConfigOptions;
}

export interface AuthorizationConfigOptions {
  consumer: ClientsConfig;
  service: ClientsConfig;
}

export interface ClientsConfig {
  name: string;
  userPoolId: string;
  clientId?: string;
  clientSecret?: string;
  publicAuthority: string;
  cookieName?: string;
}
