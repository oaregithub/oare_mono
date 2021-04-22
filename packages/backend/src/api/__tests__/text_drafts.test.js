import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('Text drafts test', () => {
  describe('POST /text_drafts', () => {
    const textUuid = 'test-uuid';
    const draftUuid = 'draft-uuid';
    const userUuid = '1';
    const PATH = `${API_PATH}/text_drafts`;
    const payload = { content: 'content', notes: 'notes', textUuid };

    const TextDraftsDao = {
      createDraft: jest.fn().mockResolvedValue(draftUuid),
      getDraftByTextUuid: jest.fn().mockResolvedValue(null),
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

    it('returns 201 on successful creation', async () => {
      setup();
      const response = await sendRequest();
      expect(response.status).toBe(201);
      expect(TextDraftsDao.createDraft).toHaveBeenCalledWith(
        userUuid,
        textUuid,
        payload.content,
        payload.notes
      );
      expect(JSON.parse(response.text)).toEqual({ draftUuid });
    });

    it('returns 400 if draft already exists', async () => {
      setup();
      sl.set('TextDraftsDao', {
        ...TextDraftsDao,
        getDraftByTextUuid: jest.fn().mockResolvedValue({ uuid: draftUuid }),
      });
      const response = await sendRequest();

      expect(response.status).toBe(400);
    });

    it('returns 500 if create draft fails', async () => {
      setup();
      sl.set('TextDraftsDao', {
        ...TextDraftsDao,
        getDraftByTextUuid: jest.fn().mockResolvedValue(null),
        createDraft: jest.fn().mockRejectedValue('Create draft failed'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });

    it('returns 500 if get draft fails', async () => {
      setup();
      sl.set('TextDraftsDao', {
        ...TextDraftsDao,
        getDraftByTextUuid: jest.fn().mockRejectedValue('Get draft failed'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });

  describe('PATCH /text_drafts/:draftUuid', () => {
    const draftUuid = 'draft-uuid';
    const PATH = `${API_PATH}/text_drafts/${draftUuid}`;

    const draft = {
      content: 'draft content',
      notes: 'draft notes',
      textUuid: 'text-uuid',
    };

    const TextDraftsDao = {
      draftExists: jest.fn().mockResolvedValue(true),
      updateDraft: jest.fn().mockResolvedValue(),
    };

    const CollectionTextUtils = {
      canEditText: jest.fn().mockResolvedValue(true),
    };

    beforeEach(() => {
      sl.set('TextDraftsDao', TextDraftsDao);
      sl.set('CollectionTextUtils', CollectionTextUtils);
    });

    const sendRequest = (cookie = true) => {
      const req = request(app).patch(PATH).send(draft);
      if (cookie) {
        return req.set('Cookie', 'jwt=token');
      }
      return req;
    };

    it('successfully updates draft', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(201);
      expect(TextDraftsDao.updateDraft).toHaveBeenCalledWith(
        draftUuid,
        draft.content,
        draft.notes
      );
    });

    it("doesn't allow non-logged in user to update draft", async () => {
      const response = await sendRequest(false);
      expect(response.status).toBe(401);
    });

    it('returns 400 if draft does not exist', async () => {
      sl.set('TextDraftsDao', {
        ...TextDraftsDao,
        draftExists: jest.fn().mockResolvedValue(false),
      });

      const response = await sendRequest();
      expect(response.status).toBe(400);
      expect(TextDraftsDao.updateDraft).not.toHaveBeenCalled();
    });

    it('returns 400 if user does not have permission to edit draft', async () => {
      sl.set('CollectionTextUtils', {
        ...CollectionTextUtils,
        canEditText: jest.fn().mockResolvedValue(false),
      });

      const response = await sendRequest();
      expect(response.status).toBe(400);
      expect(TextDraftsDao.updateDraft).not.toHaveBeenCalled();
    });

    it('returns 500 if checking for draft existence fails', async () => {
      sl.set('TextDraftsDao', {
        ...TextDraftsDao,
        draftExists: jest
          .fn()
          .mockRejectedValue('failed to check if draft exists'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(TextDraftsDao.updateDraft).not.toHaveBeenCalled();
    });

    it('returns 500 if checking for draft edit permission fails', async () => {
      sl.set('CollectionTextUtils', {
        ...CollectionTextUtils,
        canEditText: jest
          .fn()
          .mockRejectedValue('failed to check if user can edit text'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(TextDraftsDao.updateDraft).not.toHaveBeenCalled();
    });

    it('returns 500 if updating draft fails', async () => {
      sl.set('TextDraftsDao', {
        ...TextDraftsDao,
        updateDraft: jest.fn().mockRejectedValue('failed to update drafts'),
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
      totalDrafts: jest.fn().mockResolvedValue(1),
    };

    const TextEpigraphyDao = {
      getEpigraphicUnits: jest.fn().mockResolvedValue([]),
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
      sl.set('TextEpigraphyDao', TextEpigraphyDao);
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
      expect(JSON.parse(response.text)).toEqual({
        totalDrafts: 1,
        drafts: [
          {
            ...draft,
            originalText: '',
            user,
          },
        ],
      });
    });

    it('uses sort options', async () => {
      const query = {
        sortBy: 'author',
        sortOrder: 'asc',
        page: '1',
        limit: '10',
        authorFilter: 'abc',
        textFilter: 'CCT',
      };
      const response = await sendRequest().query(query);

      expect(response.status).toBe(200);
      expect(TextDraftsDao.getAllDraftUuids).toHaveBeenCalledWith(query);
    });

    it('sorts by updated date by default', async () => {
      const response = await sendRequest();
      expect(response.status).toBe(200);
      expect(TextDraftsDao.getAllDraftUuids).toHaveBeenCalledWith({
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        page: 0,
        limit: 10,
        authorFilter: '',
        textFilter: '',
      });
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

  describe('DELETE /text_drafts/:draftUuid', () => {
    const draftUuid = 'draft-uuid';
    const PATH = `${API_PATH}/text_drafts/${draftUuid}`;

    const UserDao = {
      getUserByEmail: jest.fn().mockResolvedValue({
        isAdmin: false,
      }),
    };

    const TextDraftsDao = {
      draftExists: jest.fn().mockResolvedValue(true),
      userOwnsDraft: jest.fn().mockResolvedValue(true),
      deleteDraft: jest.fn().mockResolvedValue(),
    };

    beforeEach(() => {
      sl.set('UserDao', UserDao);
      sl.set('TextDraftsDao', TextDraftsDao);
    });

    const sendRequest = (cookie = true) => {
      const req = request(app).delete(PATH);

      if (cookie) {
        return req.set('Cookie', 'jwt=token');
      }
      return req;
    };

    it('successfully deletes draft', async () => {
      const response = await sendRequest();

      expect(TextDraftsDao.draftExists).toHaveBeenCalledWith(draftUuid);
      expect(TextDraftsDao.userOwnsDraft).toHaveBeenCalled();
      expect(TextDraftsDao.deleteDraft).toHaveBeenCalledWith(draftUuid);
      expect(response.status).toBe(204);
    });

    it("doesn't allow non-logged-in users to delete drafts", async () => {
      const response = await sendRequest(false);
      expect(response.status).toBe(401);
      expect(TextDraftsDao.deleteDraft).not.toHaveBeenCalled();
    });

    it('allows admins to delete drafts they do not own', async () => {
      sl.set('UserDao', {
        getUserByEmail: jest.fn().mockResolvedValue({
          isAdmin: true,
        }),
      });

      sl.set('TextDraftsDao', {
        ...TextDraftsDao,
        userOwnsDraft: jest.fn().mockResolvedValue(false),
      });

      const response = await sendRequest();
      expect(response.status).toBe(204);
      expect(TextDraftsDao.deleteDraft).toHaveBeenCalled();
    });

    it("returns 400 if draft doesn't exist", async () => {
      sl.set('TextDraftsDao', {
        ...TextDraftsDao,
        draftExists: jest.fn().mockResolvedValue(false),
      });

      const response = await sendRequest();
      expect(response.status).toBe(400);
      expect(TextDraftsDao.deleteDraft).not.toHaveBeenCalled();
    });

    it('returns 400 if user does not own draft', async () => {
      sl.set('TextDraftsDao', {
        ...TextDraftsDao,
        userOwnsDraft: jest.fn().mockResolvedValue(false),
      });

      const response = await sendRequest();
      expect(response.status).toBe(400);
      expect(TextDraftsDao.deleteDraft).not.toHaveBeenCalled();
    });

    it('returns 500 if checking draft existence fails', async () => {
      sl.set('TextDraftsDao', {
        ...TextDraftsDao,
        draftExists: jest
          .fn()
          .mockRejectedValue('failed to check if draft exists'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(TextDraftsDao.deleteDraft).not.toHaveBeenCalled();
    });

    it('returns 500 if checking if user owns draft fails', async () => {
      sl.set('TextDraftsDao', {
        ...TextDraftsDao,
        userOwnsDraft: jest
          .fn()
          .mockRejectedValue('failed to check if user owns draft'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
      expect(TextDraftsDao.deleteDraft).not.toHaveBeenCalled();
    });

    it('returns 500 if deleting draft fails', async () => {
      sl.set('TextDraftsDao', {
        ...TextDraftsDao,
        deleteDraft: jest.fn().mockRejectedValue('failed to delete draft'),
      });

      const response = await sendRequest();
      expect(response.status).toBe(500);
    });
  });
});
