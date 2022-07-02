import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /bibliography/query', () => {
  const PATH = `${API_PATH}/bibliography/query`;

  const mockBibliographyDao = {
    queryBibliographyByPage: jest.fn().mockResolvedValue([
      {
        uuid: 'bib-test-uuid',
      },
    ]),
  };

  const mockBibliographyUtils = {
    fetchZotero: jest.fn().mockResolvedValue([
      {
        bib: 'mock-bib-3',
        data: {
          title: 'Hello',
        },
      },
    ]),
  };

  const mockResourceDao = {
    getFileURLByUuid: jest
      .fn()
      .mockResolvedValue([
        'https://oare-unit-test.com/test-resource-link-def.pdf',
      ]),
  };

  const mockResponse = {
    bibs: ['mock-bib-3'],
    datas: [
      {
        title: 'Hello',
      },
    ],
    fileURL: ['https://oare-unit-test.com/test-resource-link-def.pdf'],
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      isAdmin: true,
    }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([
      {
        name: 'VIEW_BIBLIOGRAPHY',
      },
    ]),
  };

  const setup = () => {
    sl.set('BibliographyDao', mockBibliographyDao);
    sl.set('BibliographyUtils', mockBibliographyUtils);
    sl.set('ResourceDao', mockResourceDao);
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  it('returns 200 on successful bibliography request', async () => {
    const response = await sendRequest();
    expect(response.status).toBe(200);
    expect(JSON.parse(response.text)).toEqual(mockResponse);
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
      queryBibliographyByPage: jest
        .fn()
        .mockRejectedValue('failed to retreive bibliography'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
