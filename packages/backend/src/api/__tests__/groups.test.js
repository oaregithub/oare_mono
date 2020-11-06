import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('groups api test', () => {
  const AdminUserDao = {
    getUserByEmail: jest.fn().mockResolvedValue({
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
      created_on: JSON.stringify(new Date()),
      num_users: 1,
    };
    const OareGroupDao = {
      getGroupById: jest.fn().mockResolvedValue(mockGroup),
    };

    const setup = () => {
      authorize();
      sl.set('OareGroupDao', OareGroupDao);
    };

    const sendRequest = () => request(app).get(PATH).set('Cookie', 'jwt=token');

    it("doesn't allow non-logged-in users to get group info", async () => {
      const response = await request(app).get(PATH);
      expect(response.status).toBe(401);
    });

    it("doesn't allow non-admins to get group info", async () => {
      setup();
      sl.set('UserDao', {
        getUserByEmail: jest.fn().mockResolvedValue({
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
      expect(OareGroupDao.getGroupById).toHaveBeenCalledWith(groupId);
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
    const mockGroups = [
      {
        id: 1,
        name: 'Test Group',
        created_on: JSON.stringify(new Date()),
        num_users: 0,
      },
    ];
    const OareGroupDao = {
      getAllGroups: jest.fn().mockResolvedValue(mockGroups),
    };
    const setup = () => {
      authorize();
      sl.set('OareGroupDao', OareGroupDao);
    };

    const sendRequest = () => request(app).get(PATH).set('Cookie', 'jwt=token');

    it("doesn't allow non-logged-in users to get groups", async () => {
      const response = await request(app).get(PATH);
      expect(response.status).toBe(401);
    });

    it("doesn't allow non-admins to get groups", async () => {
      sl.set('UserDao', {
        getUserByEmail: jest.fn().mockResolvedValue({
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
      expect(JSON.parse(response.text)).toEqual(mockGroups);
    });

    it('gets all groups', async () => {
      setup();
      await sendRequest();
      expect(OareGroupDao.getAllGroups).toHaveBeenCalled();
    });

    it('returns 500 if get all groups fails', async () => {
      setup();
      sl.set('OareGroupDao', {
        getAllGroups: jest.fn().mockRejectedValue('Could not get all groups'),
      });
      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('POST /groups', () => {
    const PATH = `${API_PATH}/groups`;
    const groupId = 1;
    const group = {
      id: groupId,
    };
    const OareGroupDao = {
      getGroupByName: jest.fn().mockResolvedValue(null),
      createGroup: jest.fn().mockResolvedValue(groupId),
    };
    const setup = () => {
      authorize();
      sl.set('OareGroupDao', OareGroupDao);
    };

    const sendRequest = () => request(app).post(PATH).set('Cookie', 'jwt=token');

    it("doesn't allow non-logged-in users to post", async () => {
      const response = await request(app).post(PATH);
      expect(response.status).toBe(401);
    });

    it("doesn't allow non-admins to post", async () => {
      sl.set('UserDao', {
        getUserByEmail: jest.fn().mockResolvedValue({
          isAdmin: false,
        }),
      });

      const response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it('returns 200 on success', async () => {
      setup();
      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual({
        id: groupId,
      });
    });

    it('returns 400 if the group name already exists', async () => {
      setup();
      sl.set('OareGroupDao', {
        getGroupByName: jest.fn().mockResolvedValue(group),
      });

      const response = await sendRequest();
      expect(response.status).toBe(400);
    });

    it('returns 500 if get group by name fails', async () => {
      setup();
      sl.set('OareGroupDao', {
        getGroupByName: jest.fn().mockRejectedValue('Get group by name failed'),
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
    const OareGroupDao = {
      deleteGroup: jest.fn().mockResolvedValue(null),
    };

    const setup = () => {
      authorize();
      sl.set('OareGroupDao', OareGroupDao);
    };

    const sendRequest = () => request(app).del(PATH).set('Cookie', 'jwt=token');

    it("doesn't let non-logged-in users delete", async () => {
      const response = await request(app).del(PATH);
      expect(response.status).toBe(401);
    });

    it("doesn't let non-admins delete", async () => {
      sl.set('UserDao', {
        getUserByEmail: jest.fn().mockResolvedValue({
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
      expect(OareGroupDao.deleteGroup).toHaveBeenCalledWith(groupId);
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
});
