import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /page_content/:routeName', () => {
  const routeName = 'test-route';
  const PATH = `${API_PATH}/page_content/${routeName}`;

  const mockPageContentDao = {
    getContent: jest.fn().mockResolvedValue(['Test-Content']),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn(),
  };

  const setup = () => {
    sl.set('PageContentDao', mockPageContentDao);
    sl.set('cache', mockCache);
  };

  const sendRequest = () => request(app).get(PATH);

  beforeEach(setup);

  it('Returns 200 on successful retrieval', async () => {
    const response = await sendRequest();
    expect(mockPageContentDao.getContent).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('Returns 500 on failed retrieval', async () => {
    sl.set('PageContentDao', {
      ...mockPageContentDao,
      getContent: jest.fn().mockRejectedValue('Failed content retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('PATCH /page_content/:routeName', () => {
  const routeName = 'test-route';
  const PATH = `${API_PATH}/page_content/${routeName}`;
  const mockBody = { newContent: 'test-content' };

  const mockPageContentDao = {
    editContent: jest.fn().mockResolvedValue(),
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ isAdmin: true }),
  };

  const mockCache = {
    clear: jest.fn(),
  };

  const setup = () => {
    sl.set('PageContentDao', mockPageContentDao);
    sl.set('UserDao', mockUserDao);
    sl.set('cache', mockCache);
  };

  const sendRequest = () =>
    request(app).patch(PATH).send(mockBody).set('Authorization', 'token');

  beforeEach(setup);

  it('Returns 204 on successful page content update by admin', async () => {
    const response = await sendRequest();
    expect(mockPageContentDao.editContent).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('Returns 500 on failed page content update by admin', async () => {
    sl.set('PageContentDao', {
      ...mockPageContentDao,
      editContent: jest.fn().mockRejectedValue('Failed to update page content'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
