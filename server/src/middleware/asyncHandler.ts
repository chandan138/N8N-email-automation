import { Request, Response, NextFunction } from "express";

/**
 * Wraps an async Express route handler so rejected promises
 * are forwarded to the Express error handler via next(error)
 * instead of crashing the Node process.
 *
 * Express 4 does NOT catch async rejections automatically.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
