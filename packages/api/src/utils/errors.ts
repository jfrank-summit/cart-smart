export type AppErrorType = {
    message: string;
    statusCode: number;
    name: string;
};

export const createAppError = (message: string, statusCode = 500): AppErrorType => ({
    message,
    statusCode,
    name: 'AppError'
});

export const createDatabaseError = (message = 'Database error occurred'): AppErrorType => ({
    ...createAppError(message, 500),
    name: 'DatabaseError'
});

export const createNotFoundError = (message = 'Resource not found'): AppErrorType => ({
    ...createAppError(message, 404),
    name: 'NotFoundError'
});

export const createValidationError = (message = 'Validation failed'): AppErrorType => ({
    ...createAppError(message, 400),
    name: 'ValidationError'
});

export const createUnauthorizedError = (message = 'Unauthorized'): AppErrorType => ({
    ...createAppError(message, 401),
    name: 'UnauthorizedError'
});

export const createForbiddenError = (message = 'Forbidden'): AppErrorType => ({
    ...createAppError(message, 403),
    name: 'ForbiddenError'
});

export const isAppError = (error: unknown): error is AppErrorType => {
    return typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        'message' in error &&
        'name' in error;
}; 