import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { map, Observable } from 'rxjs'

import { RESPONSE_MESSAGE_KEY, ResponseMessageMetadata } from '@/commons/decorators/response-message.decorator'

import { SuccessResponse } from '@/commons/types/response.types'

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<SuccessResponse<T>> {
    const meta = this.reflector.get<ResponseMessageMetadata | undefined>(RESPONSE_MESSAGE_KEY, context.getHandler())
    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        code: meta?.code ?? 'SUCCESS',
        message: meta?.message ?? 'OK',
        data,
      })),
    )
  }
}
