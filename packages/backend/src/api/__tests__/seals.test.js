import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

const seal = {
  uuid: 'dd978e96-1066-960b-d083-1cbb233c3764',
  name: 'Seal of Aššur-rabi s. Lā-qēpum',
  imageLinks: ['imageLink'],
  count: 1,
  sealProperties: [
    {
      'Primary Classification': 'Cylinder Seal',
    },
    {
      Style: 'Cappadocian Style',
    },
    {
      Scene: 'Presentation Scene',
    },
    {
      'Teissier Number (CS)': '110',
    },
    {
      CS: '110',
    },
  ],
  sealImpressions: [
    {
      uuid: 'd7c160df-1ef6-4070-bbe2-3d81b4938bb2',
      type: 'logosyllabic',
      language: null,
      cdliNum: 'P359420',
      translitStatus: '5536b5bd-e18e-11ea-8c9d-02b316ca7378',
      name: 'ICK 1 22a Envelope',
      displayName: 'ICK 1 22a',
      excavationPrefix: null,
      excavationNumber: null,
      museumPrefix: 'Ka',
      museumNumber: null,
      publicationPrefix: 'ICK 1',
      publicationNumber: '22a',
      objectType: 'envelope',
      source: null,
      genre: null,
      subgenre: null,
    },
  ],
};

describe('GET /seals/:uuid', () => {
  const PATH = `${API_PATH}/seals/${seal.uuid}`;

  const mockSealDao = {
    getSealByUuid: jest
      .fn()
      .mockResolvedValue({ name: seal.name, uuid: seal.uuid }),
    getSealImpressionsBySealUuid: jest
      .fn()
      .mockResolvedValue(seal.sealImpressions),
    getSealProperties: jest.fn().mockResolvedValue(seal.sealProperties),
    getSealImpressionCountBySealUuid: jest.fn().mockResolvedValue(seal.count),
    getImageBySealUuid: jest.fn().mockResolvedValue(seal.imageLinks),
  };

  const mockTextDao = {
    getTextByUuid: jest.fn().mockResolvedValue(seal.sealImpressions[0]),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };

  const setup = () => {
    sl.set('SealDao', mockSealDao);
    sl.set('cache', mockCache);
    sl.set('TextDao', mockTextDao);
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH);

  it('returns 200 on successful collections retrieval', async () => {
    const response = await sendRequest();
    expect(mockSealDao.getSealByUuid).toHaveBeenCalled();
    expect(mockSealDao.getSealImpressionCountBySealUuid).toHaveBeenCalled();
    expect(mockSealDao.getSealImpressionsBySealUuid).toHaveBeenCalled();
    expect(mockSealDao.getSealProperties).toHaveBeenCalled();
    expect(mockSealDao.getImageBySealUuid).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed seal retrieval', async () => {
    sl.set('SealDao', {
      ...mockSealDao,
      getSealByUuid: jest.fn().mockRejectedValue('failed seal retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /seals', () => {
  const PATH = `${API_PATH}/seals`;

  const mockSealDao = {
    getSeals: jest
      .fn()
      .mockResolvedValue([{ name: seal.name, uuid: seal.uuid }]),
    getSealImpressionCountBySealUuid: jest.fn().mockResolvedValue(seal.count),
    getImageBySealUuid: jest.fn().mockResolvedValue(seal.imageLinks),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };

  const setup = () => {
    sl.set('SealDao', mockSealDao);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH);

  it('returns 200 on successful collections retrieval', async () => {
    const response = await sendRequest();
    expect(mockSealDao.getSeals).toHaveBeenCalled();
    expect(mockSealDao.getSealImpressionCountBySealUuid).toHaveBeenCalled();
    expect(mockSealDao.getImageBySealUuid).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed seal retrieval', async () => {
    sl.set('SealDao', {
      ...mockSealDao,
      getSeals: jest.fn().mockRejectedValue('failed seals retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
