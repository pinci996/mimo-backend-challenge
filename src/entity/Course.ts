import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from "typeorm";
import { Chapter } from "./Chapter";

@Entity("courses")
export class Course {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index({ unique: true })
    @Column({ type: "varchar", length: 255 })
    name!: string;

    @OneToMany(() => Chapter, chapter => chapter.course)
    chapters!: Chapter[];
}