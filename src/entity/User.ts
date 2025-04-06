import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from "typeorm";
import { LessonCompletion } from "./LessonCompletion";
import { UserAchievement } from "./UserAchievement";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index({ unique: true })
    @Column({ type: "varchar", length: 255 })
    username!: string;

    @OneToMany(() => LessonCompletion, completion => completion.user)
    lessonCompletions!: LessonCompletion[];

    @OneToMany(() => UserAchievement, userAchievement => userAchievement.user)
    userAchievements!: UserAchievement[];
}