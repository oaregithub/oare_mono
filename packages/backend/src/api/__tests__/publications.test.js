import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /publications', () => {
  const PATH = `${API_PATH}/publications`;
  const publicationPrfx = 'AAA 1';
  const publication = {
    prefix: publicationPrfx,
    textNumbers: [
      {
        textUuid: '1',
        type: 'logosyllabic',
        name: '1',
        excavationPrefix: null,
        excavationNumber: null,
        museumPrefix: null,
        museumNumber: null,
        publicationPrefix: 'AAA 1',
        publicationNumber: '1',
      },
    ],
  };

  const mockPublicationDao = {
    getAllPublications: jest.fn().mockResolvedValue([publicationPrfx]),
    getPublicationsByPrfx: jest.fn().mockResolvedValue(publication),
  };

  const setup = () => {
    sl.set('PublicationDao', mockPublicationDao);
    sl.set('UserDao', {
      getUserByUuid: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
    });
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH);

  it('returns 200 on successful publications retrieval', async () => {
    const response = await sendRequest();
    expect(mockPublicationDao.getAllPublications).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed publications retrieval', async () => {
    sl.set('PublicationDao', {
      ...mockPublicationDao,
      getAllPublications: jest
        .fn()
        .mockRejectedValue('failed publications retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('returns 500 on failed publication retrieval by uuid', async () => {
    sl.set('PublicationDao', {
      ...mockPublicationDao,
      getAllPublications: jest
        .fn()
        .mockRejectedValue('failed to get publication'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
