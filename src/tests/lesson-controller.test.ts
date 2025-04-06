import { Request, Response } from 'express';
import { completeLessonController } from '../controllers/lesson-controller';
import { AppDataSource } from '../data-source'; // Needed for spyOn below

const mockSave = jest.fn();
const mockCreate = jest.fn((data) => ({ ...data, id: Date.now() }));
const mockUserFindOneBy = jest.fn();
const mockLessonFindOne = jest.fn();
const mockAchievementFind = jest.fn();
const mockChapterFind = jest.fn();
const mockCourseFind = jest.fn();
const mockLessonCompletionQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ count: 0 }),
};
const mockUserAchievementFindOneBy = jest.fn();
const mockUserAchievementSave = jest.fn();
const mockUserAchievementCreate = jest.fn((data) => ({...data}));


jest.mock('../data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn().mockImplementation((entity: Function | string) => {
             const name = typeof entity === 'function' ? entity.name : entity;
             switch (name) {
                 case 'User':
                     return { findOneBy: mockUserFindOneBy };
                 case 'Lesson':
                     return { findOne: mockLessonFindOne };
                 case 'LessonCompletion':
                     return { save: mockSave, create: mockCreate, createQueryBuilder: jest.fn(() => mockLessonCompletionQueryBuilder) };
                 case 'Achievement':
                     return { find: mockAchievementFind };
                 case 'UserAchievement':
                     return { findOneBy: mockUserAchievementFindOneBy, save: mockUserAchievementSave, create: mockUserAchievementCreate };
                 case 'Chapter':
                     return { find: mockChapterFind };
                 case 'Course':
                     return { find: mockCourseFind };
                 default:
                     return { find: jest.fn(), findOne: jest.fn(), findOneBy: jest.fn(), save: jest.fn(), create: jest.fn(), createQueryBuilder: jest.fn(() => mockLessonCompletionQueryBuilder) };
             }
        })
    }
}));


describe('completeLessonController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let responseJson: any;

    beforeEach(() => {
        jest.clearAllMocks();
        responseJson = null;

        mockRequest = {
            body: {},
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockImplementation((result) => {
                responseJson = result;
            }),
        };

        mockAchievementFind.mockResolvedValue([]);
        mockUserAchievementFindOneBy.mockResolvedValue(null);
        mockChapterFind.mockResolvedValue([]);
        mockCourseFind.mockResolvedValue([]);
        mockLessonCompletionQueryBuilder.getRawOne.mockResolvedValue({ count: 0 });
        mockUserAchievementSave.mockResolvedValue({});
    });

    it('should return 400 if required fields are missing', async () => {
        mockRequest.body = { userId: 1, lessonId: 1 };

        await completeLessonController(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(responseJson).toEqual({ message: 'Missing required fields' });
    });

    it('should return 404 if user not found', async () => {
        mockRequest.body = { userId: 99, lessonId: 1, startedAt: '2023-01-01T10:00:00Z', completedAt: '2023-01-01T10:05:00Z' };
        mockUserFindOneBy.mockResolvedValueOnce(null);

        await completeLessonController(mockRequest as Request, mockResponse as Response);

        expect(mockUserFindOneBy).toHaveBeenCalledWith({ id: 99 });
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(responseJson).toEqual({ message: 'User not found' });
    });

    it('should save completion, call achievement check, and return 201 on success', async () => {
        const fakeLesson = { id: 1, chapter: { id: 1, course: { id: 1 } } };
        const requestBody = {
             userId: 1,
             lessonId: 1,
             startedAt: '2023-01-01T10:00:00Z',
             completedAt: '2023-01-01T10:05:00Z'
        };
        mockRequest.body = requestBody;
        mockUserFindOneBy.mockResolvedValueOnce({ id: 1, username: 'test' });
        mockLessonFindOne.mockResolvedValueOnce(fakeLesson);

        const createdCompletion = { ...requestBody, id: 123, startedAt: new Date(requestBody.startedAt), completedAt: new Date(requestBody.completedAt) };
        mockCreate.mockReturnValueOnce(createdCompletion);
        mockSave.mockResolvedValueOnce(createdCompletion);

        mockLessonCompletionQueryBuilder.getRawOne.mockResolvedValue({ count: 1 });
        mockAchievementFind.mockResolvedValue([{ id: 'complete-1-lesson', type: 'lesson', threshold: 1 }]);

        await completeLessonController(mockRequest as Request, mockResponse as Response);

        expect(mockUserFindOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(mockLessonFindOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: { chapter: { course: true } } });
        expect(mockCreate).toHaveBeenCalledWith({
            userId: 1,
            lessonId: 1,
            startedAt: new Date(requestBody.startedAt),
            completedAt: new Date(requestBody.completedAt)
        });
        expect(mockSave).toHaveBeenCalledWith(createdCompletion);

        expect(mockAchievementFind).toHaveBeenCalled();
        expect(mockUserAchievementFindOneBy).toHaveBeenCalled();


        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(responseJson.message).toEqual('Lesson completion recorded successfully');
        expect(responseJson.data).toMatchObject({ userId: 1, lessonId: 1 });
    });

     it('should return 500 if database save fails', async () => {
        const fakeLesson = { id: 1, chapter: { id: 1, course: { id: 1 } } };
         const requestBody = {
             userId: 1,
             lessonId: 1,
             startedAt: '2023-01-01T10:00:00Z',
             completedAt: '2023-01-01T10:05:00Z'
        };
        mockRequest.body = requestBody;
        mockUserFindOneBy.mockResolvedValueOnce({ id: 1, username: 'test' });
        mockLessonFindOne.mockResolvedValueOnce(fakeLesson);
        const dbError = new Error('DB save failed');

        const lessonCompletionRepoMock = AppDataSource.getRepository('LessonCompletion');
        const saveSpy = jest.spyOn(lessonCompletionRepoMock, 'save').mockRejectedValueOnce(dbError);


        await completeLessonController(mockRequest as Request, mockResponse as Response);

        expect(saveSpy).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseJson).toEqual({ message: 'Error recording lesson completion' });

        saveSpy.mockRestore();
    });
});