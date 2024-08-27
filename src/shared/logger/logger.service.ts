import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModuleAsyncParams, Params } from 'nestjs-pino/params';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggerService implements LoggerModuleAsyncParams {
  @Inject(ConfigService)
  private readonly config: ConfigService;

  useFactory(args: any): Params | Promise<Params> {
    return {
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'debug',
        redact: ['request.headers.authorization'],
        genReqId(request) {
          const correlationId: string | string[] =
            request.headers['x-correlation-id'] || uuidv4();
          request.headers['x-correlation-id'] = correlationId;
          return correlationId;
        },
      },
    };
  }
}
