import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DynamooseModule } from 'nestjs-dynamoose';
import { EmailService } from './email.service';
import { UserService } from '../users/user.service';
import { EmailController } from './email.controller';
import { EmailExistsRule } from './validators/email-exists.validator';
import { EmailVerificationRecentlySentRule } from './validators/email-verification-recently-sent.validator';
import { EmailCodeVerificationRule } from '@app/app/email/validators/email-code-verification.validator';
import { VerifyEmailSchema, TABLE_NAME } from './schemas/verify-email.schema';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { EmailEntity } from '../users/entities/email.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([UserEntity, EmailEntity]),
    DynamooseModule.forFeature([
      {
        name: 'VerifyEmail',
        schema: VerifyEmailSchema,
        options: {
          tableName: TABLE_NAME,
        },
      },
    ]),
  ],
  controllers: [EmailController],
  providers: [
    EmailExistsRule,
    EmailVerificationRecentlySentRule,
    EmailCodeVerificationRule,
    EmailService,
    UserService,
  ],
  exports: [EmailService],
})
export class EmailModule {}
