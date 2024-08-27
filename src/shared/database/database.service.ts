import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { DatabaseLogger } from './database.logger';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { rdsCa } from '@app/shared/database/rds-combined-ca-bundle';
import { UserEntity } from '../../app/users/entities/user.entity';
import { EmailEntity } from '../../app/users/entities/email.entity';
import { ProviderEntity } from '../../app/oauth/entities/provider.entity';
import { ProviderUserEntity } from '../../app/oauth/entities/provider-user.entity';

@Injectable()
export class DatabaseConfigService implements TypeOrmOptionsFactory {
  constructor(
    @InjectPinoLogger(DatabaseConfigService.name)
    private readonly logger: PinoLogger,
  ) {}

  @Inject(ConfigService)
  private readonly config: ConfigService;

  public createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      replication: {
        master: {
          host: this.config.get<string>('db.postgres.write.host'),
          username: this.config.get<string>('db.postgres.write.user'),
          password: this.config.get<string>('db.postgres.write.password'),
          port: this.config.get<number>('db.postgres.write.port'),
          database: this.config.get<string>('db.postgres.database'),
        },
        slaves: [
          {
            host: this.config.get<string>('db.postgres.read.host'),
            username: this.config.get<string>('db.postgres.read.user'),
            password: this.config.get<string>('db.postgres.read.password'),
            port: this.config.get<number>('db.postgres.read.port'),
            database: this.config.get<string>('db.postgres.database'),
          },
        ],
      },
      ssl: {
        rejectUnauthorized: this.config.get<boolean>('db.postgres.useSsl'),
        ca: rdsCa,
      },
      logging: true,
      logger: new DatabaseLogger(this.logger),
      entities: [UserEntity, EmailEntity, ProviderEntity, ProviderUserEntity],
      synchronize: false,
    };
  }
}
