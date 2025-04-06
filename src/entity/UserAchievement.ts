import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { User } from "./User";
import { Achievement } from "./Achievement";

@Entity("user_achievements")
export class UserAchievement {
    @PrimaryColumn()
    userId!: number;

    @PrimaryColumn()
    achievementId!: string;

    @ManyToOne(() => User, user => user.userAchievements, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: "userId" })
    user!: User;

    @ManyToOne(() => Achievement, achievement => achievement.userAchievements, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: "achievementId" })
    achievement!: Achievement;

    @Column({ type: "datetime", nullable: true })
    completedAt!: Date | null;
}