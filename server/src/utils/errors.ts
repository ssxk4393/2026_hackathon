export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = '요청한 리소스를 찾을 수 없습니다') {
    super(404, message, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = '인증이 필요합니다') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = '권한이 없습니다') {
    super(403, message, 'FORBIDDEN');
  }
}

export class BadRequestError extends AppError {
  constructor(message = '잘못된 요청입니다') {
    super(400, message, 'BAD_REQUEST');
  }
}
