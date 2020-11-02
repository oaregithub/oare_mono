import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';

describe('dictionary api test', () => {
  it('returns 200', async () => {
    const response = await request(app).get(`/${API_PATH}/dictionary`);
    expect(response.status).toBe(200);
  });
});
