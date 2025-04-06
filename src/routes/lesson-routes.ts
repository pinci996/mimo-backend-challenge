import { Router } from "express";
import { completeLessonController } from "../controllers/lesson-controller";

const router = Router();

// POST /api/lessons/complete
router.post("/complete", completeLessonController);

export default router;