import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { Lesson } from "../entity/Lesson";
import { LessonCompletion } from "../entity/LessonCompletion";
import { Chapter } from "../entity/Chapter";
import { Course } from "../entity/Course";
import { Achievement } from "../entity/Achievement";
import { UserAchievement } from "../entity/UserAchievement";

// POST /api/lessons/complete
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
    const lesson = await lessonRepository.findOne({
      where: { id: lessonId },
      relations: { chapter: { course: true } }
    });
    if (!lesson) {
      res.status(404).json({ message: "Lesson not found" });
      return;
    }

    // Record lesson completion
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

    await checkAndUpdateAchievements(userId, lesson);

    res.status(201).json({
      message: "Lesson completion recorded successfully",
      data: newCompletion
    });
  } catch (error) {
    console.error("Error recording lesson completion:", error);
    res.status(500).json({ message: "Error recording lesson completion" });
  }
};

// Helper to chek and update achievements after lesson completed
async function checkAndUpdateAchievements(userId: number, completedLesson: Lesson): Promise<void> {
  try {
    const achievementRepository = AppDataSource.getRepository(Achievement);
    const userAchievementRepository = AppDataSource.getRepository(UserAchievement);
    const lessonCompletionRepository = AppDataSource.getRepository(LessonCompletion);

    if (!completedLesson.chapter?.course) {
        console.warn("Lesson object passed to checkAndUpdateAchievements is missing relations. Reloading.");
        const lessonWithRelations = await AppDataSource.getRepository(Lesson).findOne({
            where: { id: completedLesson.id },
            relations: { chapter: { course: true } },
        });
        if (!lessonWithRelations) {
            console.error(`Failed to reload lesson ${completedLesson.id} with relations.`);
            return;
        }
        completedLesson = lessonWithRelations;
    }

    const achievements = await achievementRepository.find();

    // 1. Calculate total lessons completed
    const totalLessonsCompleted = await lessonCompletionRepository
      .createQueryBuilder("completion")
      .select("COUNT(DISTINCT completion.lessonId)", "count")
      .where("completion.userId = :userId", { userId })
      .getRawOne();

    const lessonCount = Number(totalLessonsCompleted?.count || 0);

    // 2. Find which chapters are completed by this user
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

    // 3. Find which courses are completed by this user
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

    // 4. Check each achievement and update if conditions are met
    for (const achievement of achievements) {
      let completed = false;

      const existing = await userAchievementRepository.findOneBy({
        userId,
        achievementId: achievement.id
      });

      if (existing?.completedAt) {
        continue;
      }

      switch (achievement.type) {
        case 'lesson':
          completed = lessonCount >= achievement.threshold;
          break;

        case 'chapter':
          completed = completedChapterIds.size >= achievement.threshold;
          break;

        case 'course':

          const targetCourseId = courseNameToIdMap.get(achievement.targetId?.toLowerCase() || '');
          const lessonCourseId = completedLesson.chapter?.course?.id; 
          
          if (targetCourseId !== undefined && lessonCourseId !== undefined && targetCourseId === lessonCourseId) {
             completed = completedCourseIds.has(targetCourseId);
          } else if (targetCourseId !== undefined && !lessonCourseId) {
              console.warn(`Could not determine course for completed lesson ${completedLesson.id} when checking achievement ${achievement.id}`);
          }
          break;
      }

      if (!existing && completed) {
        await userAchievementRepository.save(
          userAchievementRepository.create({
            userId,
            achievementId: achievement.id,
            completedAt: new Date()
          })
        );
      } else if (existing && !existing.completedAt && completed) {
        existing.completedAt = new Date();
        await userAchievementRepository.save(existing);
      }
    }

  } catch (error) {
    console.error("Error checking achievements:", error);
  }
}