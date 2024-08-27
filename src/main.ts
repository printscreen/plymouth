import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { useContainer } from 'class-validator';
import { ClassTransformOptions } from 'class-transformer';
import { ValidationPipe, ValidationError } from '@nestjs/common';
import { AppModule } from './app.module';
import {
  i18nValidationErrorFactory,
  I18nValidationExceptionFilter,
} from 'nestjs-i18n';
import fastifyHelmet from '@fastify/helmet';
import fastifyCookie from '@fastify/cookie';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app: NestFastifyApplication =
    await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter(),
      { bufferLogs: true },
    );

  app.enableShutdownHooks();

  const config = app.get<ConfigService>(ConfigService);
  const port: number = config.get<number>('http.port');
  const host: string = config.get<string>('http.host');
  const timeout: number = config.get<number>('http.timeout');

  const logger: Logger = app.get(Logger);
  app.useLogger(logger);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      exceptionFactory: i18nValidationErrorFactory,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      } as ClassTransformOptions,
    }),
  );
  app.useGlobalFilters(
    new I18nValidationExceptionFilter({
      errorFormatter: (errors: ValidationError[]): object => {
        return errors.map((error) => {
          return {
            field: error.property,
            errors: error.constraints,
          };
        });
      },
    }),
  );
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  await app.register(fastifyHelmet);
  await app.register(fastifyCookie, {
    secret: config.get('cookies.secret'), // for cookies signature
  });
  const server = await app.listen(port, host);
  // MS timeout
  server.setTimeout(timeout);
}
bootstrap();
