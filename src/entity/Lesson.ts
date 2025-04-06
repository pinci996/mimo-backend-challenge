import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Chapter } from "./Chapter";
import { LessonCompletion } from "./LessonCompletion";

@Entity("lessons")
export class Lesson {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    order!: number;

    @ManyToOne(() => Chapter, chapter => chapter.lessons, { nullable: false })
    @JoinColumn({ name: "chapterId" })
    chapter!: Chapter;

    @Column()
    chapterId!: number;

    @OneToMany(() => LessonCompletion, completion => completion.lesson)
    completions!: LessonCompletion[];
}