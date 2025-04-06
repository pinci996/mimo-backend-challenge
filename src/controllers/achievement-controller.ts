import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { Achievement } from "../entity/Achievement";
import { UserAchievement } from "../entity/UserAchievement";
import { LessonCompletion } from "../entity/LessonCompletion";
import { Chapter } from "../entity/Chapter";
import { Course } from "../entity/Course";

// GET /api/achievements/user/:userId
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

    // Get all achievements and completions for this user
    const achievementRepository = AppDataSource.getRepository(Achievement);
    const userAchievementRepository = AppDataSource.getRepository(UserAchievement);

    const achievements = await achievementRepository.find();
    const userAchievements = await userAchievementRepository.find({
      where: { userId }
    });

    const userAchievementMap = new Map(
      userAchievements.map(ua => [ua.achievementId, ua])
    );

    const lessonCompletionRepository = AppDataSource.getRepository(LessonCompletion);

    // 1. Count total completed lessons
    const totalLessonsCompleted = await lessonCompletionRepository
      .createQueryBuilder("completion")
      .select("COUNT(DISTINCT completion.lessonId)", "count")
      .where("completion.userId = :userId", { userId })
      .getRawOne();

    const lessonCount = Number(totalLessonsCompleted?.count || 0);

    // 2. Calculate completed chapters
    const chapterRepository = AppDataSource.getRepository(Chapter);
    const chapters = await chapterRepository.find({
      relations: { lessons: true }
    });

    const completedChapterIds = new Set<number>();

    for (const chapter of chapters) {
      const lessonIds = chapter.lessons.map(l => l.id);
      if (lessonIds.length === 0) continue;

      const completedLessonsCount = await lessonCompletionRepository
        .createQueryBuilder("completion")
        .select("COUNT(DISTINCT completion.lessonId)", "count")
        .where("completion.userId = :userId", { userId })
        .andWhere("completion.lessonId IN (:...lessonIds)", { lessonIds })
        .getRawOne();

      if (Number(completedLessonsCount?.count || 0) === lessonIds.length) {
        completedChapterIds.add(chapter.id);
      }
    }

    // 3. Calculate completed courses
    const courseRepository = AppDataSource.getRepository(Course);
    const courses = await courseRepository.find({
      relations: { chapters: true }
    });

    const completedCourseIds = new Set<number>();
    const courseNameToIdMap = new Map<string, number>();

    for (const course of courses) {
      courseNameToIdMap.set(course.name.toLowerCase(), course.id);
       if (course.chapters.length === 0) continue;

      const allChaptersCompleted = course.chapters.every(chapter =>
        completedChapterIds.has(chapter.id)
      );

      if (allChaptersCompleted) {
        completedCourseIds.add(course.id);
      }
    }

    const achievementResults = achievements.map(achievement => {
      const userAchievement = userAchievementMap.get(achievement.id);
      const isCompleted = !!userAchievement?.completedAt;

      let progress = 0;

      switch (achievement.type) {
        case 'lesson':
          progress = Math.min(lessonCount, achievement.threshold);
          break;

        case 'chapter':
          progress = Math.min(completedChapterIds.size, achievement.threshold);
          break;

        case 'course':
          if (achievement.targetId) {
            const courseId = courseNameToIdMap.get(achievement.targetId);
            progress = courseId !== undefined && completedCourseIds.has(courseId) ? 1 : 0;
          }
          break;
      }

      return {
        id: achievement.id,
        name: achievement.name,
        isCompleted,
        progress,
        threshold: achievement.threshold
      };
    });

    res.status(200).json({
      achievements: achievementResults
    });

  } catch (error) {
    console.error("Error fetching user achievements:", error);
    res.status(500).json({ message: "Error fetching user achievements" });
  }
};
