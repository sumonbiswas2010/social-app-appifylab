import { NextResponse } from 'next/server';

export class AppError extends Error {
  constructor(message, status = 400, errors = undefined) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

// Wraps a route handler: catches anything thrown (incl. AppError) and sends the response
export function apiHandler(fn) {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          { success: false, message: err.message, errors: err.errors },
          { status: err.status }
        );
      }
      console.error(err);
      return NextResponse.json(
        { success: false, message: 'Something went wrong' },
        { status: 500 }
      );
    }
  };
}
