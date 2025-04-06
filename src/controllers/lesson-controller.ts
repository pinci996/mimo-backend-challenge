import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { Lesson } from "../entity/Lesson";
import { LessonCompletion } from "../entity/LessonCompletion";
import { checkUserAchievementsOnCompletion } from "../services/achievement-service";

export const completeLessonController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, lessonId, startedAt, completedAt } = req.body;

    if (!userId || !lessonId || !startedAt || !completedAt) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const lessonRepository = AppDataSource.getRepository(Lesson);
    const lesson = await lessonRepository.findOneBy({ id: lessonId });
    if (!lesson) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    const lessonCompletionRepository = AppDataSource.getRepository(LessonCompletion);
    const startDate = typeof startedAt === 'string' ? new Date(startedAt) : startedAt;
    const completeDate = typeof completedAt === 'string' ? new Date(completedAt) : completedAt;

    const newCompletion = lessonCompletionRepository.create({
      userId,
      lessonId,
      startedAt: startDate,
      completedAt: completeDate
    });
    await lessonCompletionRepository.save(newCompletion);

    await checkUserAchievementsOnCompletion(userId);

    res.status(201).json({
      message: "Lesson completion recorded successfully",
      data: newCompletion
    });
  } catch (error) {
    console.error("Error recording lesson completion:", error);
    res.status(500).json({ message: "Error recording lesson completion" });
  }
};