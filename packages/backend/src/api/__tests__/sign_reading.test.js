import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /sign_reading/code/:sign/:post', () => {
  const mockSign = 'TÚG';
  const mockPost = 'isPercent';
  const PATH = `${API_PATH}/sign_reading/code/${mockSign}/${mockPost}`;

  const mockSignReadingDao = {
    getSignCode: jest.fn().mockResolvedValue({
      code: 'test-code',
    }),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn(),
  };

  const setup = () => {
    sl.set('SignReadingDao', mockSignReadingDao);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH);

  it('returns 200 on successful sign code retrieval', async () => {
    const response = await sendRequest();
    expect(mockSignReadingDao.getSignCode).toHaveBeenCalledWith('TÚG', true);
    expect(response.status).toBe(200);
  });

  it('calls with false if post is not %', async () => {
    const mockFalsePost = 'notPercent';
    const falsePath = `${API_PATH}/sign_reading/code/${mockSign}/${mockFalsePost}}`;

    const response = await request(app).get(falsePath);
    expect(mockSignReadingDao.getSignCode).toHaveBeenCalledWith('TÚG', false);
    expect(response.status).toBe(200);
  });

  it('inserts results in cache', async () => {
    await sendRequest();
    expect(mockCache.insert).toHaveBeenCalled();
  });

  it('returns  500 on failed sign code retrieval', async () => {
    sl.set('SignReadingDao', {
      ...mockSignReadingDao,
      getSignCode: jest.fn().mockRejectedValue('failed sign code retrieval'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /sign_reading/format/:sign', () => {
  const mockSign = 'TUG2';
  const PATH = `${API_PATH}/sign_reading/format/${mockSign}`;

  const mockSignReadingDao = {
    getFormattedSign: jest.fn().mockResolvedValue(['TÚG']),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn(),
  };

  const setup = () => {
    sl.set('SignReadingDao', mockSignReadingDao);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH);

  it('returns 200 on successful sign formatting', async () => {
    const response = await sendRequest();
    expect(mockSignReadingDao.getFormattedSign).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('inserts results in cache', async () => {
    await sendRequest();
    expect(mockCache.insert).toHaveBeenCalled();
  });

  it('returns 500 on failed sign formatting', async () => {
    sl.set('SignReadingDao', {
      ...mockSignReadingDao,
      getFormattedSign: jest.fn().mockRejectedValue('failed to format sign'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('GET /signList', () => {
  const sortBy = 'abz';
  const allSigns = 'false';
  const PATH = `${API_PATH}/signList`;
  const signList = [
    {
      signUuid: 'signUuid',
      name: 'name',
      abz: '123a',
      mzl: 123,
      hasPng: 0,
      frequency: 100,
      code: '100',
      readings: 'readings (1.00)',
    },
  ];
  const signListReadings = [
    {
      uuid: 'uuid',
      value: 'value',
      type: 'logogram',
      count: 100,
    },
  ];

  const mockSignReadingDao = {
    getSignList: jest.fn().mockResolvedValue(signList),
    getSignCount: jest.fn().mockResolvedValue(100),
    getReadingsForSignList: jest.fn().mockResolvedValue(signListReadings),
  };

  const setup = () => {
    sl.set('SignReadingDao', mockSignReadingDao);
  };

  beforeEach(setup);

  const sendRequest = () => request(app).get(PATH).query({ allSigns, sortBy });

  it('returns 200 on successful sign list request', async () => {
    const response = await sendRequest();
    expect(mockSignReadingDao.getSignList).toHaveBeenCalled();
    expect(mockSignReadingDao.getSignCount).toHaveBeenCalled();
    expect(mockSignReadingDao.getReadingsForSignList).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 500 on failed sign formatting', async () => {
    sl.set('SignReadingDao', {
      ...mockSignReadingDao,
      getSignList: jest.fn().mockRejectedValue('failed to get sign list'),
      getSignCount: jest.fn().mockRejectedValue('failed to get sign count'),
      getReadingsForSignList: jest
        .fn()
        .mockRejectedValue('failed to get readings for sign list'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
