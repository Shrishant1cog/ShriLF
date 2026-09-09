import { NextFunction, Request, Response } from "express";

export function rateLimiter(_request: Request, _response: Response, next: NextFunction) {
  next();
}
