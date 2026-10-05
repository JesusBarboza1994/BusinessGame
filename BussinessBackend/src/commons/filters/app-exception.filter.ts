import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Response } from 'express'
import { ZodValidationException } from 'nestjs-zod'

import { AppException } from '@/commons/exceptions/app.exception'

import { ErrorResponse } from '@/commons/types/response.types'

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()
    const { status, body } = this.toBody(exception)
    if (status >= 500) this.logger.error(`[catch] ${(exception as Error)?.message}`, (exception as Error)?.stack)
    response.status(status).json(body)
  }

  private toBody(exception: unknown): { status: number; body: ErrorResponse } {
    if (exception instanceof AppException) {
      return {
        status: exception.getStatus(),
        body: { success: false, code: exception.code, message: exception.message, details: exception.details },
      }
    }
    if (exception instanceof ZodValidationException) {
      const zodError = exception.getZodError() as { issues?: { path: (string | number)[]; message: string }[] }
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: { issues: zodError?.issues?.map((issue) => ({ path: issue.path.join('.'), message: issue.message })) },
        },
      }
    }
    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        body: { success: false, code: `HTTP_${exception.getStatus()}`, message: exception.message },
      }
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { success: false, code: 'INTERNAL_ERROR', message: 'Unexpected error' },
    }
  }
}
