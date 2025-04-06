import "reflect-metadata"; // Must be imported first
import { DataSource, DataSourceOptions } from "typeorm";
import { User } from "./entity/User";
import { Course } from "./entity/Course";
import { Chapter } from "./entity/Chapter";
import { Lesson } from "./entity/Lesson";
import { LessonCompletion } from "./entity/LessonCompletion";
import { Achievement } from "./entity/Achievement";
import { UserAchievement } from "./entity/UserAchievement";

export const AppDataSourceOptions: DataSourceOptions = {
    type: "sqlite",
    database: "sqlite.db",
    synchronize: false,
    logging: false,
    entities: [
        User,
        Course,
        Chapter,
        Lesson,
        LessonCompletion,
        Achievement,
        UserAchievement
    ],
    migrations: ["src/migration/**/*.ts"],
    subscribers: [],
};

export const AppDataSource = new DataSource(AppDataSourceOptions);