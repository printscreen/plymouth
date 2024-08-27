import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OauthService } from './oauth.service';
import { OauthController } from './oauth.controller';
import { PassportModule } from '@nestjs/passport';
import { Apple } from './providers/apple.provider';
import { Google } from './providers/google.provider';
import { Facebook } from './providers/facebook.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProviderUserEntity } from './entities/provider-user.entity';
import { ProviderEntity } from './entities/provider.entity';
import { EmailEntity } from '../users/entities/email.entity';
import { UserEntity } from '../users/entities/user.entity';

@Module({
  imports: [
    HttpModule,
    PassportModule,
    TypeOrmModule.forFeature([
      ProviderUserEntity,
      EmailEntity,
      UserEntity,
      ProviderEntity,
    ]),
  ],
  controllers: [OauthController],
  providers: [OauthService, Apple, Google, Facebook],
  exports: [PassportModule],
})
export class OauthModule {}
