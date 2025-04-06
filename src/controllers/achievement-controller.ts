import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { getUserAchievementsWithProgress } from "../services/achievement-service";

export const getUserAchievementsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);

    if (!userId || isNaN(userId)) {
      res.status(400).json({ message: "Invalid user ID" });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const achievementResults = await getUserAchievementsWithProgress(userId);

    res.status(200).json({
      achievements: achievementResults
    });

  } catch (error) {
    console.error("Error fetching user achievements:", error);
    res.status(500).json({ message: "Error fetching user achievements" });
  }
};