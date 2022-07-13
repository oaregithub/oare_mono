import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /bibliographies', () => {
  const PATH = `${API_PATH}/bibliographies`;

  const mockBibliographyDao = {
    getBibliographies: jest.fn().mockResolvedValue([
      {
        uuid: 'bib-test-uuid',
      },
    ]),
  };

  const mockBibliographyUtils = {
    getZoteroReferences: jest.fn().mockResolvedValue({
      bib: 'mock-bib-3',
      data: {
        title: 'Hello',
      },
    }),
  };

  const mockResourceDao = {
    getPDFUrlByBibliographyUuid: jest
      .fn()
      .mockResolvedValue(
        'https://oare-unit-test.com/test-resource-link-def.pdf'
      ),
  };

  const mockResponse = [
    {
      bib: 'mock-bib-3',
      data: { title: 'Hello' },
      url: 'https://oare-unit-test.com/test-resource-link-def.pdf',
    },
  ];

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

  const mockCollectionTextUtils = {
    canViewText: jest.fn().mockResolvedValue(true),
    canEditText: jest.fn().mockResolvedValue(false),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };

  const setup = () => {
    sl.set('BibliographyDao', mockBibliographyDao);
    sl.set('BibliographyUtils', mockBibliographyUtils);
    sl.set('ResourceDao', mockResourceDao);
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('CollectionTextUtils', mockCollectionTextUtils);
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
      getBibliographies: jest
        .fn()
        .mockRejectedValue('failed to retreive bibliography'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
