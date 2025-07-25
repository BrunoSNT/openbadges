import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Handle specific error types
  if (error.message.includes('Signature verification failed')) {
    statusCode = 401;
    message = 'Invalid signature';
  } else if (error.message.includes('Program not initialized')) {
    statusCode = 503;
    message = 'Service temporarily unavailable';
  } else if (error.message.includes('Failed to fetch')) {
    statusCode = 503;
    message = 'Blockchain network error';
  } else if (error.message.includes('Invalid public key')) {
    statusCode = 400;
    message = 'Invalid wallet address format';
  }

  res.status(statusCode).json({
    error: message,
    code: error.code,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
