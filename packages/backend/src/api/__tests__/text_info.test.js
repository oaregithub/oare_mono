import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /text_info', () => {
  const uuid = 12345;
  const PATH = `${API_PATH}/text_info/${uuid}`;

  const mockResponse = {
    name: 'Test Name',
  };

  const mockAliasDao = {
    textAliasNames: jest.fn().mockResolvedValue('Test Name'),
  };

  const sendRequest = () => request(app).get(PATH);

  it('returns text name successfully', async () => {
    sl.set('AliasDao', mockAliasDao);
    const response = await sendRequest();
    expect(mockAliasDao.textAliasNames).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(JSON.parse(response.text)).toEqual(mockResponse);
  });

  it('returns 500 on failed name retrieval', async () => {
    sl.set('AliasDao', {
      textAliasNames: jest.fn().mockRejectedValue('Failed text name retrieval'),
    });
    const response = await sendRequest();
    expect(mockAliasDao.textAliasNames).not.toHaveBeenCalled();
    expect(response.status).toBe(500);
  });
});
