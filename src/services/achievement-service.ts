import { AppDataSource } from "../data-source";
import { Achievement } from "../entity/Achievement";
import { UserAchievement } from "../entity/UserAchievement";
import { LessonCompletion } from "../entity/LessonCompletion";
import { Chapter } from "../entity/Chapter";
import { Course } from "../entity/Course";

export interface AchievementStatus {
    id: string;
    name: string;
    isCompleted: boolean;
    progress: number;
    threshold: number;
}

async function _calculateProgressMetrics(userId: number) {
    const lessonCompletionRepository = AppDataSource.getRepository(LessonCompletion);
    const chapterRepository = AppDataSource.getRepository(Chapter);
    const courseRepository = AppDataSource.getRepository(Course);

    // 1. Lesson Count
    const totalLessonsCompleted = await lessonCompletionRepository
        .createQueryBuilder("completion")
        .select("COUNT(DISTINCT completion.lessonId)", "count")
        .where("completion.userId = :userId", { userId })
        .getRawOne();
    const lessonCount = Number(totalLessonsCompleted?.count || 0);

    // 2. Completed Chapter IDs
    const allChapters = await chapterRepository.find({ relations: { lessons: true } });
    const completedChapterIds = new Set<number>();
    for (const chapter of allChapters) {
        const lessonIds = chapter.lessons.map(l => l.id);
        if (lessonIds.length === 0) continue;
        const completedCount = await lessonCompletionRepository
            .createQueryBuilder("completion")
            .select("COUNT(DISTINCT completion.lessonId)", "count")
            .where("completion.userId = :userId", { userId })
            .andWhere("completion.lessonId IN (:...lessonIds)", { lessonIds })
            .getRawOne();
        if (Number(completedCount?.count || 0) === lessonIds.length) {
            completedChapterIds.add(chapter.id);
        }
    }

    // 3. Completed Course IDs
    const allCourses = await courseRepository.find({ relations: { chapters: true } });
    const completedCourseIds = new Set<number>();
    const courseNameToIdMap = new Map<string, number>(allCourses.map(c => [c.name.toLowerCase(), c.id]));
    for (const course of allCourses) {
        if (course.chapters.length === 0) continue;
        const allChaptersDone = course.chapters.every(chapter => completedChapterIds.has(chapter.id));
        if (allChaptersDone) {
            completedCourseIds.add(course.id);
        }
    }

    return { lessonCount, completedChapterIds, completedCourseIds, courseNameToIdMap };
}

// Called after a lesson is completed
export async function checkUserAchievementsOnCompletion(userId: number): Promise<void> {
    try {
        const achievementRepository = AppDataSource.getRepository(Achievement);
        const userAchievementRepository = AppDataSource.getRepository(UserAchievement);

        const metrics = await _calculateProgressMetrics(userId);
        const allAchievements = await achievementRepository.find();
        const userAchievements = await userAchievementRepository.find({ where: { userId } });
        const userAchievementMap = new Map(userAchievements.map(ua => [ua.achievementId, ua]));

        for (const achievement of allAchievements) {
            let completed = false;
            const existing = userAchievementMap.get(achievement.id);

            if (existing?.completedAt) continue;

            switch (achievement.type) {
                case 'lesson': completed = metrics.lessonCount >= achievement.threshold; break;
                case 'chapter': completed = metrics.completedChapterIds.size >= achievement.threshold; break;
                case 'course':
                    if (achievement.targetId) {
                        const courseId = metrics.courseNameToIdMap.get(achievement.targetId.toLowerCase());
                        completed = courseId !== undefined && metrics.completedCourseIds.has(courseId);
                    }
                    break;
            }

            if (completed) {
                if (!existing) {
                    await userAchievementRepository.save(
                        userAchievementRepository.create({ userId, achievementId: achievement.id, completedAt: new Date() })
                    );
                } else {
                    existing.completedAt = new Date();
                    await userAchievementRepository.save(existing);
                }
            }
        }
    } catch (error) {
        console.error(`Error checking achievements for user ${userId}:`, error);
    }
}

export async function getUserAchievementsWithProgress(userId: number): Promise<AchievementStatus[]> {
    const achievementRepository = AppDataSource.getRepository(Achievement);
    const userAchievementRepository = AppDataSource.getRepository(UserAchievement);

    const metrics = await _calculateProgressMetrics(userId);
    const allAchievements = await achievementRepository.find();
    const userAchievements = await userAchievementRepository.find({ where: { userId } });
    const userAchievementMap = new Map(userAchievements.map(ua => [ua.achievementId, ua]));

    const results: AchievementStatus[] = allAchievements.map(achievement => {
        const userAchievement = userAchievementMap.get(achievement.id);
        const isCompleted = !!userAchievement?.completedAt;
        let progress = 0;

        switch (achievement.type) {
            case 'lesson': progress = Math.min(metrics.lessonCount, achievement.threshold); break;
            case 'chapter': progress = Math.min(metrics.completedChapterIds.size, achievement.threshold); break;
            case 'course':
                if (achievement.targetId) {
                    const courseId = metrics.courseNameToIdMap.get(achievement.targetId.toLowerCase());
                    progress = courseId !== undefined && metrics.completedCourseIds.has(courseId) ? 1 : 0;
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

    return results;
}