import { Request, Response } from 'express';
import { getUserAchievementsController } from '../controllers/achievement-controller';
import * as AchievementService from '../services/achievement-service';
import { AchievementStatus } from '../services/achievement-service';

const mockUserFindOneBy = jest.fn();

jest.mock('../data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn().mockImplementation((entity: Function | string) => {
            const name = typeof entity === 'function' ? entity.name : entity;
             if (name === 'User') {
                 return { findOneBy: mockUserFindOneBy };
             }
             return {};
        })
    }
}));

const getUserAchievementsSpy = jest.spyOn(AchievementService, 'getUserAchievementsWithProgress');

describe('getUserAchievementsController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let responseJson: any;

    beforeEach(() => {
        jest.clearAllMocks();
        responseJson = null;
        mockRequest = { params: {} };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockImplementation((result) => { responseJson = result; }),
        };
        mockUserFindOneBy.mockResolvedValue({ id: 1, username: 'test_user' });
        getUserAchievementsSpy.mockResolvedValue([]);
    });

    it('should return 400 if userId is invalid', async () => {
        mockRequest.params = { userId: 'abc' };
        await getUserAchievementsController(mockRequest as Request, mockResponse as Response);
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(responseJson).toEqual({ message: 'Invalid user ID' });
        expect(getUserAchievementsSpy).not.toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
        mockRequest.params = { userId: '99' };
        mockUserFindOneBy.mockResolvedValueOnce(null);
        await getUserAchievementsController(mockRequest as Request, mockResponse as Response);
        expect(mockUserFindOneBy).toHaveBeenCalledWith({ id: 99 });
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(responseJson).toEqual({ message: 'User not found' });
        expect(getUserAchievementsSpy).not.toHaveBeenCalled();
    });

    it('should call achievement service and return its result on success', async () => {
        mockRequest.params = { userId: '1' };
        const mockServiceResult: AchievementStatus[] = [
            { id: 'a1', name: 'Ach 1', isCompleted: true, progress: 5, threshold: 5 },
            { id: 'a2', name: 'Ach 2', isCompleted: false, progress: 1, threshold: 3 },
        ];
        getUserAchievementsSpy.mockResolvedValueOnce(mockServiceResult);

        await getUserAchievementsController(mockRequest as Request, mockResponse as Response);

        expect(mockUserFindOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(getUserAchievementsSpy).toHaveBeenCalledWith(1);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(responseJson).toEqual({ achievements: mockServiceResult });
    });

    it('should return 500 if service call fails', async () => {
        mockRequest.params = { userId: '1' };
        const serviceError = new Error('Service failed');
        getUserAchievementsSpy.mockRejectedValueOnce(serviceError);

        await getUserAchievementsController(mockRequest as Request, mockResponse as Response);

        expect(mockUserFindOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(getUserAchievementsSpy).toHaveBeenCalledWith(1);
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseJson).toEqual({ message: 'Error fetching user achievements' });
    });

    it('should return 500 if finding user fails', async () => {
        mockRequest.params = { userId: '1' };
        const dbError = new Error('DB query failed');
        mockUserFindOneBy.mockRejectedValueOnce(dbError);

        await getUserAchievementsController(mockRequest as Request, mockResponse as Response);

        expect(mockUserFindOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(getUserAchievementsSpy).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(responseJson).toEqual({ message: 'Error fetching user achievements' });
    });
});