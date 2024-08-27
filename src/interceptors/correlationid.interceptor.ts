import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { map, Observable } from 'rxjs';

export class CorrelationidInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const request: Request = context.switchToHttp().getRequest();
    // This should normally be set by the logger in App Module
    const correlationId: string =
      request.headers['x-correlation-id'] || uuidv4();

    request.headers['x-correlation-id'] = correlationId;
    const response = context.switchToHttp().getResponse();
    context.switchToHttp().getRequest().correlationId = correlationId;
    response.header('X-Correlation-Id', correlationId);
    return next.handle().pipe(
      map((data: any) => {
        return data;
      }),
    );
  }
}
