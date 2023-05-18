import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /bibliographies', () => {
  const PATH = `${API_PATH}/bibliographies`;

  const mockBibliographyDao = {
    getAllBibliographyUuids: jest.fn().mockResolvedValue(['bib-test-uuid']),
    getBibliographyByUuid: jest.fn().mockResolvedValue({}),
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      isAdmin: true,
    }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([
      {
        name: 'BIBLIOGRAPHY',
      },
    ]),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };

  const setup = () => {
    sl.set('BibliographyDao', mockBibliographyDao);
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  it('returns 200 on successful bibliography request', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(200);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await request(app).get(PATH);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 on failed fetching bibliography', async () => {
    sl.set('BibliographyDao', {
      ...mockBibliographyDao,
      getAllBibliographyUuids: jest
        .fn()
        .mockRejectedValue('failed to retreive bibliographies'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
