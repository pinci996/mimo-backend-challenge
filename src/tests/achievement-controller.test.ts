import { Request, Response } from 'express';
import { getUserAchievementsController } from '../controllers/achievement-controller';

const mockUserFindOneBy = jest.fn();
const mockAchievementFind = jest.fn();
const mockUserAchievementFind = jest.fn();
const mockChapterFind = jest.fn();
const mockCourseFind = jest.fn();

const mockQBGetRawOne = jest.fn();
const mockQBAndWhere = jest.fn().mockReturnThis();
const mockQBWhere = jest.fn().mockReturnThis();
const mockQBSelect = jest.fn().mockReturnThis();
const mockLessonCompletionQueryBuilder = {
    select: mockQBSelect,
    where: mockQBWhere,
    andWhere: mockQBAndWhere,
    getRawOne: mockQBGetRawOne,
};


jest.mock('../data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn().mockImplementation((entity: Function | string) => {
            const name = typeof entity === 'function' ? entity.name : entity;
             switch (name) {
                 case 'User': return { findOneBy: mockUserFindOneBy };
                 case 'Achievement': return { find: mockAchievementFind };
                 case 'UserAchievement': return { find: mockUserAchievementFind };
                 case 'LessonCompletion': return { createQueryBuilder: jest.fn(() => mockLessonCompletionQueryBuilder) };
                 case 'Chapter': return { find: mockChapterFind };
                 case 'Course': return { find: mockCourseFind };
                 default: return { find: jest.fn(), createQueryBuilder: jest.fn(() => mockLessonCompletionQueryBuilder) };
             }
        })
    }
}));


describe('getUserAchievementsController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let responseJson: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockQBSelect.mockClear();
        mockQBWhere.mockClear();
        mockQBAndWhere.mockClear();
        mockQBGetRawOne.mockClear();

        responseJson = null;
        mockRequest = { params: {} };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockImplementation((result) => { responseJson = result; }),
        };

        mockUserFindOneBy.mockResolvedValue({ id: 1, username: 'test_user' });
        mockAchievementFind.mockResolvedValue([
            { id: 'complete-5-lessons', name: 'Complete 5', type: 'lesson', threshold: 5 },
            { id: 'complete-1-chapter', name: 'Complete 1 Chapter', type: 'chapter', threshold: 1 },
            { id: 'complete-swift-course', name: 'Complete Swift', type: 'course', threshold: 1, targetId: 'swift' },
        ]);
        mockUserAchievementFind.mockResolvedValue([]);
        mockChapterFind.mockResolvedValue([
             { id: 10, lessons: [{id: 101}, {id: 102}], name: 'Chapter 1' }
        ]);
        mockCourseFind.mockResolvedValue([
             { id: 20, name: 'Swift', chapters: [{id: 10}]}
        ]);
        mockQBGetRawOne.mockResolvedValue({ count: 0 });

    });

    it('should return 404 if user not found', async () => {
        mockRequest.params = { userId: '99' };
        mockUserFindOneBy.mockResolvedValueOnce(null);

        await getUserAchievementsController(mockRequest as Request, mockResponse as Response);

        expect(mockUserFindOneBy).toHaveBeenCalledWith({ id: 99 });
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(responseJson).toEqual({ message: 'User not found' });
    });

    it('should return achievements with 0 progress if no lessons completed', async () => {
        mockRequest.params = { userId: '1' };
        mockQBGetRawOne.mockResolvedValue({ count: 0 });

        await getUserAchievementsController(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockQBGetRawOne).toHaveBeenCalled();
        responseJson.achievements.forEach((a: any) => {
            expect(a.progress).toBe(0);
            expect(a.isCompleted).toBe(false);
        });
    });

    it('should calculate lesson progress correctly', async () => {
        mockRequest.params = { userId: '1' };
        mockQBGetRawOne.mockReset();
        const selectSpy = jest.spyOn(mockLessonCompletionQueryBuilder, 'select');
        const andWhereSpy = jest.spyOn(mockLessonCompletionQueryBuilder, 'andWhere');

        selectSpy.mockImplementation(function(this: any, selection: string) {
             if (selection === 'COUNT(DISTINCT completion.lessonId)') {
                mockQBGetRawOne.mockResolvedValueOnce({ count: 3 });
             }
             return this;
        });
        andWhereSpy.mockImplementation(function(this: any) {
            mockQBGetRawOne.mockResolvedValueOnce({ count: 0 });
            return this;
         });


        await getUserAchievementsController(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        const lessonAchievement = responseJson.achievements.find((a: any) => a.id === 'complete-5-lessons');
        expect(lessonAchievement.progress).toBe(3);
        expect(lessonAchievement.isCompleted).toBe(false);

        selectSpy.mockRestore();
        andWhereSpy.mockRestore();
    });


    it('should return 500 if database query fails', async () => {
        mockRequest.params = { userId: '1' };
        const dbError = new Error('DB query failed');
        mockUserFindOneBy.mockRejectedValueOnce(dbError);

        await getUserAchievementsController(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseJson).toEqual({ message: 'Error fetching user achievements' });
    });
});