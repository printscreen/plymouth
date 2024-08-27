import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import * as path from 'path';
import configuration from './config/configuration';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { DynamooseModule } from 'nestjs-dynamoose';
import { I18nModule, QueryResolver, AcceptLanguageResolver } from 'nestjs-i18n';
import { LoggerModule, PinoLogger } from 'nestjs-pino';
import { RequestContextModule } from 'nestjs-request-context';
import { AppExceptionFilter } from './filters/exceptions/app-exception.filter';
import { AwsSdkModule } from 'aws-sdk-v3-nest';
import { S3Client } from '@aws-sdk/client-s3';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CorrelationidInterceptor } from '@app/interceptors/correlationid.interceptor';
import { AuthorizationModule } from './auth/authorization.module';
import { AuthorizationConfigOptions } from './auth/authorization.config';
import { DatabaseConfigService } from '@app/shared/database/database.service';
import { DynamodbConfigService } from '@app/shared/dynamodb/dynamo.config';
import { LoggerService } from '@app/shared/logger/logger.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OauthModule } from '@app/app/oauth/oauth.module';
import { UserModule } from '@app/app/users/user.module';
import { EmailModule } from '@app/app/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    LoggerModule.forRootAsync(new LoggerService()),
    AwsSdkModule.registerAsync({
      isGlobal: true,
      clientType: S3Client,
      useFactory: async (configService: ConfigService, logger: PinoLogger) =>
        new S3Client({
          ...configService.get<object>('aws.s3'),
          logger,
        }),
      imports: [ConfigModule, LoggerModule],
      inject: [ConfigService, PinoLogger],
    }),
    AwsSdkModule.registerAsync({
      isGlobal: true,
      clientType: CognitoIdentityProviderClient,
      useFactory: async (config: ConfigService, logger: PinoLogger) =>
        new CognitoIdentityProviderClient({
          ...config.get<object>('aws.cognito'),
          logger,
        }),
      imports: [ConfigModule, LoggerModule],
      inject: [ConfigService, PinoLogger],
    }),
    // We use a DynamoDB ORM rather than the raw AWS class
    DynamooseModule.forRootAsync({
      useClass: DynamodbConfigService,
    }),
    TypeOrmModule.forRootAsync({ useClass: DatabaseConfigService }),
    RequestContextModule,
    HttpModule.registerAsync({
      useFactory: (configService: ConfigService, logger: PinoLogger) => ({
        timeout: 5000,
        maxRedirects: 5,
        axiosConfig: {
          transformRequest: [
            (
              data: any,
              headers: { [x: string]: any },
              config: { correlationId: string },
            ) => {
              headers['X-Correlation-ID'] = config.correlationId;
              return data;
            },
          ],
        },
      }),
    }),
    AuthorizationModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        return configService.get<AuthorizationConfigOptions>('clients');
      },
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    OauthModule,
    UserModule,
    EmailModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationidInterceptor,
    },
  ],
  exports: [I18nModule],
})
export class AppModule {}
