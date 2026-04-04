import { CorrelationIdMiddleware } from './correlation-id.middleware';
import type { Request, Response, NextFunction } from 'express';

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
    mockReq = { headers: {} };
    mockRes = { setHeader: jest.fn() };
    mockNext = jest.fn();
  });

  it('devrait propager le X-Request-Id existant dans la réponse', () => {
    const existingId = 'abc-123-existing';
    mockReq.headers!['x-request-id'] = existingId;

    middleware.use(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith('x-request-id', existingId);
    expect(mockReq.headers!['x-request-id']).toBe(existingId);
  });

  it('devrait générer un UUID si X-Request-Id est absent', () => {
    middleware.use(mockReq as Request, mockRes as Response, mockNext);

    const generatedId = mockReq.headers!['x-request-id'] as string;
    expect(generatedId).toBeDefined();
    expect(generatedId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(mockRes.setHeader).toHaveBeenCalledWith('x-request-id', generatedId);
  });

  it('devrait appeler next()', () => {
    middleware.use(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
