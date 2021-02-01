import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('Text drafts test', () => {
  describe('POST /text_drafts/:textUuid', () => {
    const textUuid = 'test-uuid';
    const draftUuid = 'draft-uuid';
    const userId = 1;
    const PATH = `${API_PATH}/text_drafts/${textUuid}`;
    const payload = { content: 'content', notes: 'notes' };

    const TextDraftsDao = {
      createDraft: jest.fn().mockResolvedValue(),
      getDraft: jest.fn().mockResolvedValue({ uuid: draftUuid }),
      updateDraft: jest.fn().mockResolvedValue(),
    };

    const UserDao = {
      getUserByEmail: jest.fn().mockResolvedValue({
        id: userId,
      }),
    };

    const setup = () => {
      sl.set('UserDao', UserDao);
      sl.set('TextDraftsDao', TextDraftsDao);
    };

    const sendRequest = () => request(app).post(PATH).send(payload).set('Cookie', 'jwt=token');

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
      expect(TextDraftsDao.createDraft).toHaveBeenCalledWith(userId, textUuid, payload.content, payload.notes);
    });

    it('updates draft if it already exists', async () => {
      setup();
      await sendRequest();

      expect(TextDraftsDao.getDraft).toHaveBeenCalledWith(userId, textUuid);
      expect(TextDraftsDao.updateDraft).toHaveBeenCalledWith(draftUuid, payload.content, payload.notes);
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
});
