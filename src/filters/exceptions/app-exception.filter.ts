import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

type HttpExceptionResponse = {
  status?: number;
  statusCode?: number;
  error?: string;
  message?: string;
};

type ExceptionResponseBody = {
  statusCode: number;
  message: string;
};

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  constructor(
    private httpAdapterHost: HttpAdapterHost,
    @InjectPinoLogger()
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    let body: ExceptionResponseBody = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal Server Error',
    };

    if (exception instanceof HttpException) {
      const error = exception as HttpException;
      const response = error.getResponse() as HttpExceptionResponse;
      body = {
        statusCode: response.status || response.statusCode,
        message: response.error || response.message,
      };
    }

    const { httpAdapter } = this.httpAdapterHost;

    if (body.statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(body);
    }

    httpAdapter.reply(ctx.getResponse(), body, body.statusCode);
  }
}
