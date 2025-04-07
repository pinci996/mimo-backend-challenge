import { Router } from "express";
import { completeLessonController } from "../controllers/lesson-controller";
import { validateRequest } from "../middleware/validateRequest";
import { completeLessonSchema } from "../validation/lesson-schemas";

const router = Router();

router.post(
    "/complete",
    validateRequest(completeLessonSchema),
    completeLessonController
);

export default router;