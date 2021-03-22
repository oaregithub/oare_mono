import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('Text drafts test', () => {
  describe('POST /text_drafts/:textUuid', () => {
    const textUuid = 'test-uuid';
    const draftUuid = 'draft-uuid';
    const userUuid = '1';
    const PATH = `${API_PATH}/text_drafts/${textUuid}`;
    const payload = { content: 'content', notes: 'notes' };

    const TextDraftsDao = {
      createDraft: jest.fn().mockResolvedValue(),
      getDraft: jest.fn().mockResolvedValue({ uuid: draftUuid }),
      updateDraft: jest.fn().mockResolvedValue(),
    };

    const UserDao = {
      getUserByEmail: jest.fn().mockResolvedValue({
        uuid: userUuid,
      }),
    };

    const CollectionTextUtils = {
      canEditText: jest.fn().mockResolvedValue(true),
    };

    const setup = () => {
      sl.set('UserDao', UserDao);
      sl.set('TextDraftsDao', TextDraftsDao);
      sl.set('CollectionTextUtils', CollectionTextUtils);
    };

    const sendRequest = () =>
      request(app).post(PATH).send(payload).set('Cookie', 'jwt=token');

    it('returns 400 if user does not have permission to edit the text', async () => {
      setup();
      sl.set('CollectionTextUtils', {
        ...CollectionTextUtils,
        canEditText: jest.fn().mockResolvedValue(false),
      });

      const response = await sendRequest();
      expect(response.status).toBe(400);
    });

    it('returns 401 when user is not logged in', async () => {
      const response = await request(app).post(PATH).send(payload);
      expect(response.status).toBe(401);
    });

    it('returns 201 on successful update', async () => {
      setup();
      const response = await sendRequest();
      expect(response.status).toBe(201);
    });

    it('creates new draft if one does not exist', async () => {
      setup();
      sl.set('TextDraftsDao', {
        ...TextDraftsDao,
        getDraft: jest.fn().mockResolvedValue(null),
      });

      await sendRequest();
      expect(TextDraftsDao.createDraft).toHaveBeenCalledWith(
        userUuid,
        textUuid,
        payload.content,
        payload.notes
      );
    });

    it('updates draft if it already exists', async () => {
      setup();
      await sendRequest();

      expect(TextDraftsDao.getDraft).toHaveBeenCalledWith(userUuid, textUuid);
      expect(TextDraftsDao.updateDraft).toHaveBeenCalledWith(
        draftUuid,
        payload.content,
        payload.notes
      );
    });

    it('returns 500 if create draft fails', async () => {
      setup();
      sl.set('TextDraftsDao', {
        ...TextDraftsDao,
        getDraft: jest.fn().mockResolvedValue(null),
        createDraft: jest.fn().mockRejectedValue('Create draft failed'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 if get draft fails', async () => {
      setup();
      sl.set('TextDraftsDao', {
        ...TextDraftsDao,
        getDraft: jest.fn().mockRejectedValue('Get draft failed'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 if update draft fails', async () => {
      setup();
      sl.set('TextDraftsDao', {
        ...TextDraftsDao,
        updateDraft: jest.fn().mockRejectedValue('Update draft failed'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('GET /text_drafts/user/:userUuid', () => {
    const userUuid = 'user-uuid';
    const PATH = `${API_PATH}/text_drafts/user/${userUuid}`;
    const draft = {
      content: 'content',
      notes: 'notes',
    };

    const mockTextDraftsDao = {
      getAllDraftUuidsByUser: jest.fn().mockResolvedValue(['draft-uuid']),
      getDraftByUuid: jest.fn().mockResolvedValue(draft),
    };

    const mockUserDao = {
      getUserByEmail: jest.fn().mockResolvedValue({
        uuid: userUuid,
        isAdmin: false,
      }),
    };

    beforeEach(() => {
      sl.set('TextDraftsDao', mockTextDraftsDao);
      sl.set('UserDao', mockUserDao);
    });

    const sendRequest = () => request(app).get(PATH).set('Cookie', 'jwt=token');

    it('returns list of drafts', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual([draft]);
      expect(mockTextDraftsDao.getAllDraftUuidsByUser).toHaveBeenCalledWith(
        userUuid
      );
    });

    it('returns 401 when not logged in', async () => {
      const response = await request(app).get(PATH);
      expect(response.status).toBe(401);
    });

    it('returns 500 when getting drafts fails', async () => {
      sl.set('TextDraftsDao', {
        ...mockTextDraftsDao,
        getAllDraftUuidsByUser: jest
          .fn()
          .mockRejectedValue('failed to get drafts'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 when resolving draft UUID fails', async () => {
      sl.set('TextDraftsDao', {
        ...mockTextDraftsDao,
        getDraftByUuid: jest.fn().mockRejectedValue('could not resolve draft'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it("returns 403 if user is not admin and tries to access another user's drafts", async () => {
      sl.set('UserDao', {
        ...mockUserDao,
        getUserByEmail: jest.fn().mockResolvedValue({
          uuid: 'other-user',
          isAdmin: false,
        }),
      });

      const response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it("allows admins to access any user's drafts", async () => {
      sl.set('UserDao', {
        ...mockUserDao,
        getUserByEmail: jest.fn().mockResolvedValue({
          uuid: 'other-user',
          isAdmin: true,
        }),
      });

      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual([draft]);
    });
  });

  describe('GET /text_drafts', () => {
    const PATH = `${API_PATH}/text_drafts`;

    const draft = {
      userUuid: 'user-uuid',
    };

    const TextDraftsDao = {
      getAllDraftUuids: jest.fn().mockResolvedValue(['draft-uuid']),
      getDraftByUuid: jest.fn().mockResolvedValue(draft),
    };

    const user = {
      firstName: 'John',
      lastName: 'Doe',
      uuid: 'user-uuid',
    };

    const UserDao = {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: true,
      }),
      getUserByUuid: jest.fn().mockResolvedValue(user),
    };

    beforeEach(() => {
      sl.set('TextDraftsDao', TextDraftsDao);
      sl.set('UserDao', UserDao);
    });

    const sendRequest = (cookie = true) => {
      const req = request(app).get(PATH);

      if (cookie) {
        return req.set('Cookie', 'jwt=token');
      }
      return req;
    };

    it('gets drafts with users attached', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual([
        {
          ...draft,
          user,
        },
      ]);
    });

    it("doesn't allow non-admins to access route", async () => {
      sl.set('UserDao', {
        ...UserDao,
        getUserByEmail: jest.fn().mockResolvedValue({
          isAdmin: false,
        }),
      });

      const response = await sendRequest();
      expect(response.status).toBe(403);
    });

    it("doesn't allow non-logged-in users to access route", async () => {
      const response = await sendRequest(false);
      expect(response.status).toBe(401);
    });

    it('returns 500 if getting draft uuids fails', async () => {
      sl.set('TextDraftsDao', {
        ...TextDraftsDao,
        getAllDraftUuids: jest
          .fn()
          .mockRejectedValue('failed to get draft uuids'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 if getting draft by uuid fails', async () => {
      sl.set('TextDraftsDao', {
        ...TextDraftsDao,
        getDraftByUuid: jest
          .fn()
          .mockRejectedValue("couldn't get draft by uuid"),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 if getting user by uuid fails', async () => {
      sl.set('UserDao', {
        ...UserDao,
        getUserByUuid: jest.fn().mockRejectedValue("couldn't get user by uuid"),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });
});
