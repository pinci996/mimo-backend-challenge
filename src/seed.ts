import { AppDataSource } from './data-source';
import { User } from './entity/User';
import { Course } from './entity/Course';
import { Chapter } from './entity/Chapter';
import { Lesson } from './entity/Lesson';
import { Achievement } from './entity/Achievement';

async function seedDatabase() {
    await AppDataSource.initialize();
    console.log('Data Source initialized for seeding.');

    const userRepository = AppDataSource.getRepository(User);
    const courseRepository = AppDataSource.getRepository(Course);
    const chapterRepository = AppDataSource.getRepository(Chapter);
    const lessonRepository = AppDataSource.getRepository(Lesson);
    const achievementRepository = AppDataSource.getRepository(Achievement);

    try {
        // Hardcoded User
        const userId = 1;
        let user = await userRepository.findOneBy({ id: userId });
        if (!user) {
            user = userRepository.create({ id: userId, username: 'mimo_user' });
            await userRepository.save(user);
            console.log('User seeded.');
        } else {
            console.log('User already exists.');
        }

        // Courses
        const courseData = [
            { id: 1, name: 'Swift' },
            { id: 2, name: 'Javascript' },
            { id: 3, name: 'C#' },
        ];
        for (const data of courseData) {
            const existing = await courseRepository.findOneBy({ id: data.id });
            if (!existing) {
                await courseRepository.save(courseRepository.create(data));
            }
        }
        console.log('Courses seeded/verified.');


        // -Chapters & Lessons
        const findOrCreateChapter = async (data: { courseId: number, name: string, order: number }): Promise<Chapter> => {
            let chapter = await chapterRepository.findOne({ where: { courseId: data.courseId, order: data.order }});
            if (!chapter) {
                chapter = chapterRepository.create(data);
                await chapterRepository.save(chapter);
                console.log(`Chapter '${data.name}' created.`);
            }
            return chapter;
        };
        const findOrCreateLesson = async (data: { chapterId: number, name: string, order: number }): Promise<Lesson> => {
             let lesson = await lessonRepository.findOne({ where: { chapterId: data.chapterId, order: data.order }});
             if (!lesson) {
                 lesson = lessonRepository.create(data);
                 await lessonRepository.save(lesson);
                  console.log(`Lesson '${data.name}' created.`);
             }
             return lesson;
        };

        // Swift
        const swiftCourse = await courseRepository.findOneByOrFail({id: 1});
        const swiftCh1 = await findOrCreateChapter({ courseId: swiftCourse.id, name: 'Swift Basics', order: 1 });
        await findOrCreateLesson({ chapterId: swiftCh1.id, name: 'Introduction to Swift', order: 1 });
        await findOrCreateLesson({ chapterId: swiftCh1.id, name: 'Variables and Constants', order: 2 });
        await findOrCreateLesson({ chapterId: swiftCh1.id, name: 'Control Flow', order: 3 });
        const swiftCh2 = await findOrCreateChapter({ courseId: swiftCourse.id, name: 'Swift Intermediate', order: 2 });
        await findOrCreateLesson({ chapterId: swiftCh2.id, name: 'Functions', order: 1 });
        await findOrCreateLesson({ chapterId: swiftCh2.id, name: 'Classes & Structs', order: 2 });


        // Javascript
        const jsCourse = await courseRepository.findOneByOrFail({id: 2});
        const jsCh1 = await findOrCreateChapter({ courseId: jsCourse.id, name: 'JS Fundamentals', order: 1 });
        await findOrCreateLesson({ chapterId: jsCh1.id, name: 'Intro to JS', order: 1 });
        await findOrCreateLesson({ chapterId: jsCh1.id, name: 'Data Types', order: 2 });
        await findOrCreateLesson({ chapterId: jsCh1.id, name: 'Operators', order: 3 });
        await findOrCreateLesson({ chapterId: jsCh1.id, name: 'Loops', order: 4 });
        await findOrCreateLesson({ chapterId: jsCh1.id, name: 'Arrays', order: 5 });

        // C#
        const csharpCourse = await courseRepository.findOneByOrFail({id: 3});
        const csCh1 = await findOrCreateChapter({ courseId: csharpCourse.id, name: 'C# Getting Started', order: 1 });
        await findOrCreateLesson({ chapterId: csCh1.id, name: 'Hello World in C#', order: 1 });
        await findOrCreateLesson({ chapterId: csCh1.id, name: 'Basic Syntax', order: 2 });

        console.log('Chapters and Lessons seeded/verified.');

        // Achievements
        const achievementData: Achievement[] = [
            { id: 'complete-5-lessons', name: 'Complete 5 Lessons', type: 'lesson', threshold: 5 },
            { id: 'complete-25-lessons', name: 'Complete 25 Lessons', type: 'lesson', threshold: 25 },
            { id: 'complete-50-lessons', name: 'Complete 50 Lessons', type: 'lesson', threshold: 50 },
            { id: 'complete-1-chapter', name: 'Complete 1 Chapter', type: 'chapter', threshold: 1 },
            { id: 'complete-5-chapters', name: 'Complete 5 Chapters', type: 'chapter', threshold: 5 },
            { id: 'complete-swift-course', name: 'Complete the Swift course', type: 'course', threshold: 1, targetId: 'swift' },
            { id: 'complete-javascript-course', name: 'Complete the Javascript course', type: 'course', threshold: 1, targetId: 'javascript' },
            { id: 'complete-csharp-course', name: 'Complete the C# course', type: 'course', threshold: 1, targetId: 'csharp' },
        ] as Achievement[];

        for (const data of achievementData) {
             const existing = await achievementRepository.findOneBy({ id: data.id });
             if (!existing) {
                 await achievementRepository.save(achievementRepository.create(data));
             }
        }
        console.log('Achievements seeded/verified.');


        console.log('Database seeding finished successfully.');

    } catch (error) {
        console.error('Error during database seeding:', error);
    } finally {
        await AppDataSource.destroy();
        console.log('Data Source closed.');
    }
}

seedDatabase();