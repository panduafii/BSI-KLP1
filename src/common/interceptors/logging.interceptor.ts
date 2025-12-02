import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl } = request;
    const requestId = request.requestId;
    const started = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - started;
        this.logger.log(`${method} ${originalUrl} [${requestId}] ${duration}ms`);
      })
    );
  }
}
