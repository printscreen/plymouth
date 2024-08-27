import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EmailModule } from '../email/email.module';
import { OauthModule } from '../oauth/oauth.module';
import { OauthService } from '../oauth/oauth.service';
import { DynamooseModule } from 'nestjs-dynamoose';
import { UserService } from './user.service';
import { EmailService } from '../email/email.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { EmailEntity } from './entities/email.entity';
import { UserNameExistsRule } from './validators/username-exists.validator';
import { EmailVerifiedRule } from './validators/email-verified.validator';
import { VerifyEmailSchema } from '../email/schemas/verify-email.schema';
import { Apple } from '@app/app/oauth/providers/apple.provider';
import { Google } from '@app/app/oauth/providers/google.provider';
import { Facebook } from '@app/app/oauth/providers/facebook.provider';
import { ProviderUserEntity } from '@app/app/oauth/entities/provider-user.entity';

@Module({
  imports: [
    HttpModule,
    OauthModule,
    EmailModule,
    TypeOrmModule.forFeature([UserEntity, EmailEntity, ProviderUserEntity]),
    DynamooseModule.forFeature([
      {
        name: 'VerifyEmail',
        schema: VerifyEmailSchema,
        options: {
          tableName: 'user.verify-email',
        },
      },
    ]),
  ],
  controllers: [UserController],
  providers: [
    UserNameExistsRule,
    EmailVerifiedRule,
    UserService,
    OauthService,
    EmailService,
    Apple,
    Google,
    Facebook,
  ],
  exports: [UserService],
})
export class UserModule {}
