import { Router } from "express";
import { getUserAchievementsController } from "../controllers/achievement-controller";

const router = Router();

// GET /api/achievements/user/:userId
router.get("/user/:userId", getUserAchievementsController);

export default router;