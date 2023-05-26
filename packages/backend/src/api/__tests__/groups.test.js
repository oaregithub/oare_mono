import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('groups api test', () => {
  const AdminUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      isAdmin: true,
    }),
  };

  const authorize = () => {
    sl.set('UserDao', AdminUserDao);
  };

  describe('GET /groups/:id', () => {
    const groupId = 1;
    const PATH = `${API_PATH}/groups/${groupId}`;

    const mockGroup = {
      id: groupId,
      name: 'Test Group',
      createdOn: JSON.stringify(new Date()),
      description: 'Test Description',
    };

    const mockOareGroupDao = {
      getGroupById: jest.fn().mockResolvedValue(mockGroup),
    };

    const setup = () => {
      authorize();
      sl.set('OareGroupDao', mockOareGroupDao);
    };

    const sendRequest = () =>
      request(app).get(PATH).set('Authorization', 'token');

    it("doesn't allow non-logged-in users to get group info", async () => {
      const response = await request(app).get(PATH);
      expect(response.status).toBe(401);
    });

    it("doesn't allow non-admins to get group info", async () => {
      setup();
      sl.set('UserDao', {
        getUserByUuid: jest.fn().mockResolvedValue({
          isAdmin: false,
        }),
      });

      const response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it('returns 200 on successful group retrieval', async () => {
      setup();
      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual(mockGroup);
    });

    it('retrieves a group by the passed in ID', async () => {
      setup();
      await sendRequest();
      expect(mockOareGroupDao.getGroupById).toHaveBeenCalledWith(groupId);
    });

    it('returns 400 if non existent group ID is given', async () => {
      setup();
      sl.set('OareGroupDao', {
        getGroupById: jest.fn().mockResolvedValue(null),
      });

      const response = await sendRequest();
      expect(response.status).toBe(400);
    });

    it('returns 500 if getting group fails', async () => {
      setup();
      sl.set('OareGroupDao', {
        getGroupById: jest.fn().mockRejectedValue('Get group failed'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('GET /groups', () => {
    const PATH = `${API_PATH}/groups`;

    const mockGroup = {
      id: 1,
      name: 'Test Group',
      createdOn: JSON.stringify(new Date()),
      num_users: 0,
    };

    const mockOareGroupDao = {
      getAllGroupIds: jest.fn().mockResolvedValue([1]),
      getGroupById: jest.fn().mockResolvedValue(mockGroup),
    };

    const setup = () => {
      authorize();
      sl.set('OareGroupDao', mockOareGroupDao);
    };

    const sendRequest = () =>
      request(app).get(PATH).set('Authorization', 'token');

    it("doesn't allow non-logged-in users to get groups", async () => {
      const response = await request(app).get(PATH);
      expect(response.status).toBe(401);
    });

    it("doesn't allow non-admins to get groups", async () => {
      sl.set('UserDao', {
        getUserByUuid: jest.fn().mockResolvedValue({
          isAdmin: false,
        }),
      });

      const response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it('successfully returns all groups', async () => {
      setup();
      const response = await sendRequest();

      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual([mockGroup]);
    });

    it('gets all groups', async () => {
      setup();
      await sendRequest();
      expect(mockOareGroupDao.getAllGroupIds).toHaveBeenCalled();
    });

    it('returns 500 if get all groups fails', async () => {
      setup();
      sl.set('OareGroupDao', {
        getAllGroupIds: jest.fn().mockRejectedValue('Could not get all groups'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('POST /groups', () => {
    const PATH = `${API_PATH}/groups`;

    const groupId = 1;

    const mockOareGroupDao = {
      groupNameExists: jest.fn().mockResolvedValue(false),
      createGroup: jest.fn().mockResolvedValue(groupId),
    };

    const setup = () => {
      authorize();
      sl.set('OareGroupDao', mockOareGroupDao);
    };

    const sendRequest = () =>
      request(app).post(PATH).set('Authorization', 'token');

    it("doesn't allow non-logged-in users to post", async () => {
      const response = await request(app).post(PATH);
      expect(response.status).toBe(401);
    });

    it("doesn't allow non-admins to post", async () => {
      sl.set('UserDao', {
        getUserByUuid: jest.fn().mockResolvedValue({
          isAdmin: false,
        }),
      });

      const response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it('returns 201 on success', async () => {
      setup();
      const response = await sendRequest();
      expect(response.status).toBe(201);
      expect(JSON.parse(response.text)).toEqual({
        id: groupId,
      });
    });

    it('returns 400 if the group name already exists', async () => {
      setup();
      sl.set('OareGroupDao', {
        groupNameExists: jest.fn().mockResolvedValue(true),
      });

      const response = await sendRequest();
      expect(response.status).toBe(400);
    });

    it('returns 500 if group name checking fails', async () => {
      setup();
      sl.set('OareGroupDao', {
        groupNameExists: jest
          .fn()
          .mockRejectedValue('Get group by name failed'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 if create group fails', async () => {
      setup();
      sl.set('OareGroupDao', {
        createGroup: jest.fn().mockRejectedValue(null),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /group/:id', () => {
    const groupId = 1;
    const PATH = `${API_PATH}/groups/${groupId}`;

    const mockOareGroupDao = {
      deleteGroup: jest.fn().mockResolvedValue(null),
    };

    const setup = () => {
      authorize();
      sl.set('OareGroupDao', mockOareGroupDao);
    };

    const sendRequest = () =>
      request(app).del(PATH).set('Authorization', 'token');

    it("doesn't let non-logged-in users delete", async () => {
      const response = await request(app).del(PATH);
      expect(response.status).toBe(401);
    });

    it("doesn't let non-admins delete", async () => {
      sl.set('UserDao', {
        getUserByUuid: jest.fn().mockResolvedValue({
          isAdmin: false,
        }),
      });

      const response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it('successfully deletes group', async () => {
      setup();
      const response = await sendRequest();
      expect(response.status).toBe(201);
      expect(mockOareGroupDao.deleteGroup).toHaveBeenCalledWith(groupId);
    });

    it('returns 500 if delete group fails', async () => {
      setup();
      sl.set('OareGroupDao', {
        deleteGroup: jest.fn().mockRejectedValue('delete group failed'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('PATCH /groups/:id', () => {
    const groupId = 1;
    const PATH = `${API_PATH}/groups/${groupId}`;

    const mockPATCH = {
      description: 'Test Description',
    };

    const tooLongPATCH = {
      description: 'a'.repeat(201),
    };

    const mockOareGroupDao = {
      updateGroupDescription: jest.fn().mockResolvedValue(),
      getGroupById: jest.fn().mockResolvedValue(true),
    };

    const setup = () => {
      sl.set('OareGroupDao', mockOareGroupDao);
      sl.set('UserDao', {
        getUserByUuid: jest.fn().mockResolvedValue({
          isAdmin: true,
        }),
      });
    };

    beforeEach(setup);

    const sendRequest = () =>
      request(app).patch(PATH).send(mockPATCH).set('Authorization', 'token');

    it('returns 204 on successful description update', async () => {
      const response = await sendRequest();
      expect(mockOareGroupDao.updateGroupDescription).toHaveBeenCalled();
      expect(response.status).toBe(204);
    });

    it('returns 500 on failed description update', async () => {
      sl.set('OareGroupDao', {
        ...mockOareGroupDao,
        updateGroupDescription: jest
          .fn()
          .mockRejectedValue('failed description update'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 400 when group does not exist', async () => {
      sl.set('OareGroupDao', {
        ...mockOareGroupDao,
        getGroupById: jest.fn().mockResolvedValue(false),
      });
      const response = await sendRequest();
      expect(mockOareGroupDao.updateGroupDescription).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
    });

    it('does not allow non-admins to update description', async () => {
      sl.set('UserDao', {
        getUserByUuid: jest.fn().mockResolvedValue({
          isAdmin: false,
        }),
      });
      const response = await sendRequest();
      expect(mockOareGroupDao.updateGroupDescription).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
    });

    it('does not allow non-logged-in users to update description', async () => {
      const response = await request(app).patch(PATH).send(mockPATCH);
      expect(mockOareGroupDao.updateGroupDescription).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
    });

    it('returns 400 if description is too long', async () => {
      const response = await request(app)
        .patch(PATH)
        .send(tooLongPATCH)
        .set('Authorization', 'token');
      expect(mockOareGroupDao.updateGroupDescription).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
    });
  });
});
