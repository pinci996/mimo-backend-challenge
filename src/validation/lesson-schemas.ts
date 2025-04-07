import { z } from 'zod';

// Schema POST /api/lessons/complete
export const completeLessonSchema = z.object({
    body: z.object({
        userId: z.number({
            required_error: 'userId is required',
            invalid_type_error: 'userId must be a number',
        }).int().positive({ message: 'userId must be a positive integer' }),

        lessonId: z.number({
            required_error: 'lessonId is required',
            invalid_type_error: 'lessonId must be a number',
        }).int().positive({ message: 'lessonId must be a positive integer' }),

        startedAt: z.string({
            required_error: 'startedAt is required',
            invalid_type_error: 'startedAt must be a string',
        }).datetime({ message: 'startedAt must be a valid ISO 8601 date string' }),

        completedAt: z.string({
            required_error: 'completedAt is required',
            invalid_type_error: 'completedAt must be a string',
        }).datetime({ message: 'completedAt must be a valid ISO 8601 date string' }),
    }),
});

export type CompleteLessonInput = z.infer<typeof completeLessonSchema>['body'];
