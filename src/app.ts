import "reflect-metadata";
import express, { Application, Request, Response, NextFunction } from "express";
import lessonRoutes from "./routes/lesson-routes";
import achievementRoutes from "./routes/achievement-routes";

const app: Application = express();

app.use(express.json());

// Routes
app.use("/api/lessons", lessonRoutes);
app.use("/api/achievements", achievementRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: "An unexpected error occurred",
    error: process.env.NODE_ENV === "production" ? undefined : err.message
  });
});

export default app;