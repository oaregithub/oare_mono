import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('POST /text_discourse', () => {
  const PATH = `${API_PATH}/text_discourse`;

  const mockTextDiscourseDao = {
    insertNewDiscourseRow: jest.fn().mockResolvedValue(),
  };

  const mockUserDao = {
    getUserByEmail: jest.fn().mockResolvedValue({
      isAdmin: true,
    }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest
      .fn()
      .mockResolvedValue([{ name: 'INSERT_DISCOURSE_ROWS' }]),
  };

  const mockPayload = {
    spelling: 'a-na',
    occurrences: [
      {
        textUuid: 'textUuid',
        epigraphyUuids: ['uuid1', 'uuid2'],
        line: 1,
        textName: 'textName',
        reading: 'reading',
      },
    ],
  };

  const setup = () => {
    sl.set('TextDiscourseDao', mockTextDiscourseDao);
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).post(PATH).send(mockPayload).set('Cookie', 'jwt=token');

  it('returns 201 on successful discourse row insertion', async () => {
    const response = await sendRequest();
    expect(mockTextDiscourseDao.insertNewDiscourseRow).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it('returns 500 on failed insertion', async () => {
    sl.set('TextDiscourseDao', {
      ...mockTextDiscourseDao,
      insertNewDiscourseRow: jest
        .fn()
        .mockRejectedValue('failed to insert new discourse row'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });

  it('does not allow non-logged-in users to insert new discourse rows', async () => {
    const response = await request(app).post(PATH).send(mockPayload);
    expect(mockTextDiscourseDao.insertNewDiscourseRow).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('does not allow users without permission to insert new discourse rows', async () => {
    sl.set('PermissionsDao', {
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(mockTextDiscourseDao.insertNewDiscourseRow).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});
