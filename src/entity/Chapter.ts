import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Course } from "./Course";
import { Lesson } from "./Lesson";

@Entity("chapters")
export class Chapter {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    order!: number;

    @ManyToOne(() => Course, course => course.chapters, { nullable: false })
    @JoinColumn({ name: "courseId" })
    course!: Course;

    @Column()
    courseId!: number;

    @OneToMany(() => Lesson, lesson => lesson.chapter)
    lessons!: Lesson[];
}