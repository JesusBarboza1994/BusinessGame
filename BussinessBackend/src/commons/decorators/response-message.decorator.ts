import { SetMetadata } from '@nestjs/common'

export const RESPONSE_MESSAGE_KEY = 'response-message'

export interface ResponseMessageMetadata {
  code: string
  message: string
}

export const ResponseMessage = (code: string, message: string) => SetMetadata(RESPONSE_MESSAGE_KEY, { code, message })
