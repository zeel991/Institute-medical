import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: 'File upload error',
      details: err.message,
    });
  }

  if (err.message.includes('Only images and PDFs are allowed')) {
    return res.status(400).json({
      error: err.message,
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};
