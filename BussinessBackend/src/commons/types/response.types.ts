export interface SuccessResponse<T> {
  success: true
  code: string
  message: string
  data: T
}

export interface ErrorResponse {
  success: false
  code: string
  message: string
  details?: object
}
