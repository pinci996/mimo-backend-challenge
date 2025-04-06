import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSetup1743722105211 implements MigrationInterface {
    name = 'InitialSetup1743722105211'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "courses" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(255) NOT NULL)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6ba1a54849ae17832337a39d5e" ON "courses" ("name") `);
        await queryRunner.query(`CREATE TABLE "chapters" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "order" integer NOT NULL, "courseId" integer NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "lessons" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "order" integer NOT NULL, "chapterId" integer NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "lesson_completions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer NOT NULL, "lessonId" integer NOT NULL, "startedAt" datetime NOT NULL, "completedAt" datetime NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "achievements" ("id" varchar(100) PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "type" varchar CHECK( "type" IN ('lesson','chapter','course') ) NOT NULL, "threshold" integer NOT NULL, "targetId" varchar)`);
        await queryRunner.query(`CREATE TABLE "user_achievements" ("userId" integer NOT NULL, "achievementId" varchar NOT NULL, "completedAt" datetime, PRIMARY KEY ("userId", "achievementId"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "username" varchar(255) NOT NULL)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users" ("username") `);
        await queryRunner.query(`CREATE TABLE "temporary_chapters" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "order" integer NOT NULL, "courseId" integer NOT NULL, CONSTRAINT "FK_becd2c25ed5b601e7a4466271c8" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_chapters"("id", "name", "order", "courseId") SELECT "id", "name", "order", "courseId" FROM "chapters"`);
        await queryRunner.query(`DROP TABLE "chapters"`);
        await queryRunner.query(`ALTER TABLE "temporary_chapters" RENAME TO "chapters"`);
        await queryRunner.query(`CREATE TABLE "temporary_lessons" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "order" integer NOT NULL, "chapterId" integer NOT NULL, CONSTRAINT "FK_1067c75d93c6ce6408cd1ad156a" FOREIGN KEY ("chapterId") REFERENCES "chapters" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_lessons"("id", "name", "order", "chapterId") SELECT "id", "name", "order", "chapterId" FROM "lessons"`);
        await queryRunner.query(`DROP TABLE "lessons"`);
        await queryRunner.query(`ALTER TABLE "temporary_lessons" RENAME TO "lessons"`);
        await queryRunner.query(`CREATE TABLE "temporary_lesson_completions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer NOT NULL, "lessonId" integer NOT NULL, "startedAt" datetime NOT NULL, "completedAt" datetime NOT NULL, CONSTRAINT "FK_fdac229c4cbdebdd482a3854a9e" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_5241b14081904537154f16b15dc" FOREIGN KEY ("lessonId") REFERENCES "lessons" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_lesson_completions"("id", "userId", "lessonId", "startedAt", "completedAt") SELECT "id", "userId", "lessonId", "startedAt", "completedAt" FROM "lesson_completions"`);
        await queryRunner.query(`DROP TABLE "lesson_completions"`);
        await queryRunner.query(`ALTER TABLE "temporary_lesson_completions" RENAME TO "lesson_completions"`);
        await queryRunner.query(`CREATE TABLE "temporary_user_achievements" ("userId" integer NOT NULL, "achievementId" varchar NOT NULL, "completedAt" datetime, CONSTRAINT "FK_3ac6bc9da3e8a56f3f7082012dd" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_6a5a5816f54d0044ba5f3dc2b74" FOREIGN KEY ("achievementId") REFERENCES "achievements" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("userId", "achievementId"))`);
        await queryRunner.query(`INSERT INTO "temporary_user_achievements"("userId", "achievementId", "completedAt") SELECT "userId", "achievementId", "completedAt" FROM "user_achievements"`);
        await queryRunner.query(`DROP TABLE "user_achievements"`);
        await queryRunner.query(`ALTER TABLE "temporary_user_achievements" RENAME TO "user_achievements"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_achievements" RENAME TO "temporary_user_achievements"`);
        await queryRunner.query(`CREATE TABLE "user_achievements" ("userId" integer NOT NULL, "achievementId" varchar NOT NULL, "completedAt" datetime, PRIMARY KEY ("userId", "achievementId"))`);
        await queryRunner.query(`INSERT INTO "user_achievements"("userId", "achievementId", "completedAt") SELECT "userId", "achievementId", "completedAt" FROM "temporary_user_achievements"`);
        await queryRunner.query(`DROP TABLE "temporary_user_achievements"`);
        await queryRunner.query(`ALTER TABLE "lesson_completions" RENAME TO "temporary_lesson_completions"`);
        await queryRunner.query(`CREATE TABLE "lesson_completions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer NOT NULL, "lessonId" integer NOT NULL, "startedAt" datetime NOT NULL, "completedAt" datetime NOT NULL)`);
        await queryRunner.query(`INSERT INTO "lesson_completions"("id", "userId", "lessonId", "startedAt", "completedAt") SELECT "id", "userId", "lessonId", "startedAt", "completedAt" FROM "temporary_lesson_completions"`);
        await queryRunner.query(`DROP TABLE "temporary_lesson_completions"`);
        await queryRunner.query(`ALTER TABLE "lessons" RENAME TO "temporary_lessons"`);
        await queryRunner.query(`CREATE TABLE "lessons" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "order" integer NOT NULL, "chapterId" integer NOT NULL)`);
        await queryRunner.query(`INSERT INTO "lessons"("id", "name", "order", "chapterId") SELECT "id", "name", "order", "chapterId" FROM "temporary_lessons"`);
        await queryRunner.query(`DROP TABLE "temporary_lessons"`);
        await queryRunner.query(`ALTER TABLE "chapters" RENAME TO "temporary_chapters"`);
        await queryRunner.query(`CREATE TABLE "chapters" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "order" integer NOT NULL, "courseId" integer NOT NULL)`);
        await queryRunner.query(`INSERT INTO "chapters"("id", "name", "order", "courseId") SELECT "id", "name", "order", "courseId" FROM "temporary_chapters"`);
        await queryRunner.query(`DROP TABLE "temporary_chapters"`);
        await queryRunner.query(`DROP INDEX "IDX_fe0bb3f6520ee0469504521e71"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "user_achievements"`);
        await queryRunner.query(`DROP TABLE "achievements"`);
        await queryRunner.query(`DROP TABLE "lesson_completions"`);
        await queryRunner.query(`DROP TABLE "lessons"`);
        await queryRunner.query(`DROP TABLE "chapters"`);
        await queryRunner.query(`DROP INDEX "IDX_6ba1a54849ae17832337a39d5e"`);
        await queryRunner.query(`DROP TABLE "courses"`);
    }

}
