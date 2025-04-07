import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validateRequest = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        res.status(400).json({
          message: "Input validation failed",
          errors: formattedErrors,
        });
        return;
      }
      console.error("Unexpected error during validation:", error);
      res.status(500).json({ message: "Internal server error during validation" });
      return;
    }
  };