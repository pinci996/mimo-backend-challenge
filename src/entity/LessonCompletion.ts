import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Lesson } from "./Lesson";

@Entity("lesson_completions")
export class LessonCompletion {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, user => user.lessonCompletions, { nullable: false })
    @JoinColumn({ name: "userId" })
    user!: User;

    @Column()
    userId!: number;

    @ManyToOne(() => Lesson, lesson => lesson.completions, { nullable: false })
    @JoinColumn({ name: "lessonId" })
    lesson!: Lesson;

    @Column()
    lessonId!: number;

    @Column({ type: "datetime" })
    startedAt!: Date;

    @Column({ type: "datetime" })
    completedAt!: Date;
}