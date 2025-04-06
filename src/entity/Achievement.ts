import { Entity, PrimaryColumn, Column, OneToMany } from "typeorm";
import { UserAchievement } from "./UserAchievement";

export type AchievementType = "lesson" | "chapter" | "course";

@Entity("achievements")
export class Achievement {
    @PrimaryColumn({ type: "varchar", length: 100 }) 
    id!: string; // "complete-5-lessons"

    @Column()
    name!: string;

    @Column({
        type: "simple-enum",
        enum: ["lesson", "chapter", "course"]
    })
    type!: AchievementType;

    @Column()
    threshold!: number;

    @Column({ nullable: true }) // targetId is optional
    targetId?: string; // e.g., "swift"

    @OneToMany(() => UserAchievement, userAchievement => userAchievement.achievement)
    userAchievements!: UserAchievement[];
}
