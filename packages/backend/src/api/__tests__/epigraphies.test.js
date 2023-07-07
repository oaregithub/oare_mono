import app from '@/app';
import { API_PATH } from '@/setupRoutes';
import request from 'supertest';
import sl from '@/serviceLocator';

describe('GET /epigraphies/:uuid', () => {
  const uuid = 'test-uuid';
  const PATH = `${API_PATH}/epigraphies/${uuid}`;

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ uuid: 'user-uuid' }),
  };

  const mockCollectionTextUtils = {
    canViewText: jest.fn().mockResolvedValue(true),
  };

  const mockTextDao = {
    textExists: jest.fn().mockResolvedValue(true),
    getTextByUuid: jest.fn().mockResolvedValue({
      collectionUuid: 'collection-uuid',
      translitStatus: 'test-translit-status',
    }),
  };

  const mockTextEpigraphyDao = {
    getEpigraphicUnits: jest.fn().mockResolvedValue([]),
  };

  const mockTextDiscourseDao = {
    getTextDiscourseUnits: jest.fn().mockResolvedValue([]),
  };

  const mockCollectionDao = {
    getCollectionRowByUuid: jest.fn().mockResolvedValue({}),
  };

  const mockBibliographyDao = {
    getCitationsByTextUuid: jest.fn().mockResolvedValue([]),
  };

  const mockResourceDao = {
    getTextFileByTextUuid: jest.fn().mockResolvedValue({}),
  };

  const mockHierarchyDao = {
    getTextTransliterationStatusByUuid: jest.fn().mockResolvedValue({}),
  };

  const mockCache = {
    retrieve: jest.fn().mockResolvedValue(null),
    insert: jest.fn().mockImplementation((_key, response, _filter) => response),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('CollectionTextUtils', mockCollectionTextUtils);
    sl.set('TextDao', mockTextDao);
    sl.set('TextEpigraphyDao', mockTextEpigraphyDao);
    sl.set('TextDiscourseDao', mockTextDiscourseDao);
    sl.set('CollectionDao', mockCollectionDao);
    sl.set('BibliographyDao', mockBibliographyDao);
    sl.set('ResourceDao', mockResourceDao);
    sl.set('HierarchyDao', mockHierarchyDao);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  const sendRequest = () =>
    request(app).get(PATH).set('Authorization', 'token');

  it('returns 200 upon successful epigraphy retrieval', async () => {
    const response = await sendRequest();
    expect(mockTextDao.textExists).toHaveBeenCalled();
    expect(mockTextDao.getTextByUuid).toHaveBeenCalled();
    expect(mockCollectionDao.getCollectionRowByUuid).toHaveBeenCalled();
    expect(mockBibliographyDao.getCitationsByTextUuid).toHaveBeenCalled();
    expect(mockResourceDao.getTextFileByTextUuid).toHaveBeenCalled();
    expect(
      mockHierarchyDao.getTextTransliterationStatusByUuid
    ).toHaveBeenCalled();
    expect(mockTextEpigraphyDao.getEpigraphicUnits).toHaveBeenCalled();
    expect(mockTextDiscourseDao.getTextDiscourseUnits).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('returns 400 if text does not exist', async () => {
    sl.set('TextDao', {
      ...mockTextDao,
      textExists: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(400);
  });

  it('returns 403 if cannot view text', async () => {
    sl.set('CollectionTextUtils', {
      ...mockCollectionTextUtils,
      canViewText: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if retrieval fails', async () => {
    sl.set('TextEpigraphyDao', {
      ...mockTextEpigraphyDao,
      getEpigraphicUnits: jest
        .fn()
        .mockRejectedValue('Failed to retrieve units'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});

describe('PATCH /epigraphies/:uuid', () => {
  const uuid = 'test-uuid';
  const PATH = `${API_PATH}/epigraphies/${uuid}`;

  const mockCollectionTextUtils = {
    canEditText: jest.fn().mockResolvedValue(true),
  };

  const mockTextDao = {
    textExists: jest.fn().mockResolvedValue(true),
  };

  const mockEditTextUtils = {
    addSide: jest.fn().mockResolvedValue(),
    addColumn: jest.fn().mockResolvedValue(),
    addRegion: jest.fn().mockResolvedValue(),
    addLine: jest.fn().mockResolvedValue(),
    addUndeterminedLines: jest.fn().mockResolvedValue(),
    addWord: jest.fn().mockResolvedValue(),
    addSign: jest.fn().mockResolvedValue(),
    addUndeterminedSigns: jest.fn().mockResolvedValue(),
    addDivider: jest.fn().mockResolvedValue(),
    editSide: jest.fn().mockResolvedValue(),
    editColumn: jest.fn().mockResolvedValue(),
    editRegion: jest.fn().mockResolvedValue(),
    editUndeterminedLines: jest.fn().mockResolvedValue(),
    editSign: jest.fn().mockResolvedValue(),
    editUndeterminedSigns: jest.fn().mockResolvedValue(),
    editDivider: jest.fn().mockResolvedValue(),
    splitLine: jest.fn().mockResolvedValue(),
    splitWord: jest.fn().mockResolvedValue(),
    mergeLines: jest.fn().mockResolvedValue(),
    mergeWords: jest.fn().mockResolvedValue(),
    reorderSign: jest.fn().mockResolvedValue(),
    removeSide: jest.fn().mockResolvedValue(),
    removeColumn: jest.fn().mockResolvedValue(),
    removeRegion: jest.fn().mockResolvedValue(),
    removeLine: jest.fn().mockResolvedValue(),
    removeUndeterminedLines: jest.fn().mockResolvedValue(),
    removeWord: jest.fn().mockResolvedValue(),
    removeDivider: jest.fn().mockResolvedValue(),
    removeSign: jest.fn().mockResolvedValue(),
    cleanLines: jest.fn().mockResolvedValue(),
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({
      uuid: 'user-uuid',
    }),
  };

  const mockCache = {
    clear: jest.fn(),
  };

  const mockUtils = {
    createTransaction: jest.fn(async cb => {
      await cb();
    }),
  };

  const setup = () => {
    sl.set('CollectionTextUtils', mockCollectionTextUtils);
    sl.set('EditTextUtils', mockEditTextUtils);
    sl.set('UserDao', mockUserDao);
    sl.set('TextDao', mockTextDao);
    sl.set('cache', mockCache);
    sl.set('utils', mockUtils);
  };

  beforeEach(setup);

  const sendRequest = (type, auth = true) => {
    const req = request(app).patch(PATH).send({ type, textUuid: 'textUuid' });
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 401 when user is not logged in', async () => {
    const response = await sendRequest(undefined, false);
    expect(response.status).toBe(401);
  });

  it('returns 403 when user does not have text edit permission', async () => {
    sl.set('CollectionTextUtils', {
      ...mockCollectionTextUtils,
      canEditText: jest.fn().mockResolvedValue(false),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 204 on successful add side', async () => {
    const response = await sendRequest('addSide');
    expect(mockEditTextUtils.addSide).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed add side', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      addSide: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('addSide');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful add column', async () => {
    const response = await sendRequest('addColumn');
    expect(mockEditTextUtils.addColumn).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed add column', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      addColumn: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('addColumn');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful add broken', async () => {
    const response = await sendRequest('addRegionBroken');
    expect(mockEditTextUtils.addRegion).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed add broken', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      addRegion: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('addRegionBroken');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful add ruling', async () => {
    const response = await sendRequest('addRegionRuling');
    expect(mockEditTextUtils.addRegion).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed add ruling', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      addRegion: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('addRegionRuling');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful add seal impression', async () => {
    const response = await sendRequest('addRegionSealImpression');
    expect(mockEditTextUtils.addRegion).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed add seal impression', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      addRegion: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('addRegionSealImpression');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful add uninscribed', async () => {
    const response = await sendRequest('addRegionUninscribed');
    expect(mockEditTextUtils.addRegion).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed add uninscribed', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      addRegion: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('addRegionUninscribed');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful add line', async () => {
    const response = await sendRequest('addLine');
    expect(mockEditTextUtils.addLine).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed add line', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      addLine: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('addLine');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful add undetermined lines', async () => {
    const response = await sendRequest('addUndeterminedLines');
    expect(mockEditTextUtils.addUndeterminedLines).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed add undetermined lines', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      addUndeterminedLines: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('addUndeterminedLines');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful add word', async () => {
    const response = await sendRequest('addWord');
    expect(mockEditTextUtils.addWord).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed add word', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      addWord: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('addWord');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful add sign', async () => {
    const response = await sendRequest('addSign');
    expect(mockEditTextUtils.addSign).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed add sign', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      addSign: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('addSign');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful add undetermined signs', async () => {
    const response = await sendRequest('addUndeterminedSigns');
    expect(mockEditTextUtils.addUndeterminedSigns).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed add undetermined signs', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      addUndeterminedSigns: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('addUndeterminedSigns');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful add divider', async () => {
    const response = await sendRequest('addDivider');
    expect(mockEditTextUtils.addDivider).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed add divider', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      addDivider: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('addDivider');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful edit side', async () => {
    const response = await sendRequest('editSide');
    expect(mockEditTextUtils.editSide).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed edit side', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      editSide: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('editSide');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful edit column', async () => {
    const response = await sendRequest('editColumn');
    expect(mockEditTextUtils.editColumn).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed edit column', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      editColumn: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('editColumn');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful edit broken', async () => {
    const response = await sendRequest('editRegionBroken');
    expect(mockEditTextUtils.editRegion).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed edit broken', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      editRegion: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('editRegionBroken');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful edit ruling', async () => {
    const response = await sendRequest('editRegionRuling');
    expect(mockEditTextUtils.editRegion).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed edit ruling', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      editRegion: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('editRegionRuling');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful edit seal impression', async () => {
    const response = await sendRequest('editRegionSealImpression');
    expect(mockEditTextUtils.editRegion).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed edit seal impression', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      editRegion: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('editRegionSealImpression');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful edit uninscribed', async () => {
    const response = await sendRequest('editRegionUninscribed');
    expect(mockEditTextUtils.editRegion).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed edit uninscribed', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      editRegion: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('editRegionUninscribed');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful edit undetermined lines', async () => {
    const response = await sendRequest('editUndeterminedLines');
    expect(mockEditTextUtils.editUndeterminedLines).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed edit undetermined lines', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      editUndeterminedLines: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('editUndeterminedLines');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful edit sign', async () => {
    const response = await sendRequest('editSign');
    expect(mockEditTextUtils.editSign).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed edit sign', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      editSign: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('editSign');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful edit undetermined signs', async () => {
    const response = await sendRequest('editUndeterminedSigns');
    expect(mockEditTextUtils.editUndeterminedSigns).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed edit undetermined signs', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      editUndeterminedSigns: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('editUndeterminedSigns');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful edit divider', async () => {
    const response = await sendRequest('editDivider');
    expect(mockEditTextUtils.editDivider).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed edit divider', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      editDivider: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('editDivider');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful split line', async () => {
    const response = await sendRequest('splitLine');
    expect(mockEditTextUtils.splitLine).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed split line', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      splitLine: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('splitLine');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful split word', async () => {
    const response = await sendRequest('splitWord');
    expect(mockEditTextUtils.splitWord).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed split word', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      splitWord: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('splitWord');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful merge line', async () => {
    const response = await sendRequest('mergeLine');
    expect(mockEditTextUtils.mergeLines).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed merge line', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      mergeLines: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('mergeLine');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful merge word', async () => {
    const response = await sendRequest('mergeWord');
    expect(mockEditTextUtils.mergeWords).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed merge word', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      mergeWords: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('mergeWord');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful reorder signs', async () => {
    const response = await sendRequest('reorderSign');
    expect(mockEditTextUtils.reorderSign).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed reorder sign', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      reorderSign: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('reorderSign');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful remove side', async () => {
    const response = await sendRequest('removeSide');
    expect(mockEditTextUtils.removeSide).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed remove side', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      removeSide: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('removeSide');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful remove column', async () => {
    const response = await sendRequest('removeColumn');
    expect(mockEditTextUtils.removeColumn).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed remove column', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      removeColumn: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('removeColumn');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful remove broken', async () => {
    const response = await sendRequest('removeRegionBroken');
    expect(mockEditTextUtils.removeRegion).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed remove broken', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      removeRegion: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('removeRegionBroken');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful remove ruling', async () => {
    const response = await sendRequest('removeRegionRuling');
    expect(mockEditTextUtils.removeRegion).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed remove ruling', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      removeRegion: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('removeRegionRuling');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful remove seal impression', async () => {
    const response = await sendRequest('removeRegionSealImpression');
    expect(mockEditTextUtils.removeRegion).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed remove seal impression', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      removeRegion: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('removeRegionSealImpression');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful remove uninscribed', async () => {
    const response = await sendRequest('removeRegionUninscribed');
    expect(mockEditTextUtils.removeRegion).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed remove uninscribed', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      removeRegion: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('removeRegionUninscribed');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful remove line', async () => {
    const response = await sendRequest('removeLine');
    expect(mockEditTextUtils.removeLine).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed remove line', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      removeLine: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('removeLine');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful remove undetermined lines', async () => {
    const response = await sendRequest('removeUndeterminedLines');
    expect(mockEditTextUtils.removeUndeterminedLines).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed remove undetermined lines', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      removeUndeterminedLines: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('removeUndeterminedLines');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful remove word', async () => {
    const response = await sendRequest('removeWord');
    expect(mockEditTextUtils.removeWord).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed remove word', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      removeWord: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('removeWord');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful remove divider', async () => {
    const response = await sendRequest('removeDivider');
    expect(mockEditTextUtils.removeDivider).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed remove divider', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      removeDivider: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('removeDivider');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful remove sign', async () => {
    const response = await sendRequest('removeSign');
    expect(mockEditTextUtils.removeSign).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed remove sign', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      removeSign: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('removeSign');
    expect(response.status).toBe(500);
  });

  it('returns 204 on successful remove undetermined signs', async () => {
    const response = await sendRequest('removeUndeterminedSigns');
    expect(mockEditTextUtils.removeSign).toHaveBeenCalled();
    expect(mockEditTextUtils.cleanLines).toHaveBeenCalled();
    expect(mockCache.clear).toHaveBeenCalled();
    expect(response.status).toBe(204);
  });

  it('returns 500 on failed remove undetermined signs', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      removeSign: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('removeUndeterminedSigns');
    expect(response.status).toBe(500);
  });

  it('returns 500 on failed clean lines', async () => {
    sl.set('EditTextUtils', {
      ...mockEditTextUtils,
      cleanLines: jest.fn().mockRejectedValue(),
    });
    const response = await sendRequest('cleanLines');
    expect(response.status).toBe(500);
  });
});

describe('POST /epigraphies', () => {
  const PATH = `${API_PATH}/epigraphies`;

  const mockBody = {
    tables: {
      epigraphies: [
        {
          uuid: 'test-epigraphy-uuid',
        },
      ],
      markups: [
        {
          uuid: 'test-markup-uuid',
        },
      ],
      discourses: [
        {
          uuid: 'test-discourse-uuid',
        },
      ],
      text: {
        uuid: 'test-uuid',
        name: 'test-name',
      },
      itemProperties: [
        {
          uuid: 'test-property-uuid',
        },
      ],
      signInfo: [],
      resources: [
        {
          uuid: 'test-resource-uuid',
        },
      ],
      links: [
        {
          uuid: 'test-link-uuid',
        },
      ],
      hierarchy: {
        uuid: 'test-hierarchy-uuid',
      },
      trees: [
        {
          uuid: 'test-tree-uuid',
          type: 'test-type',
        },
      ],
    },
  };

  const mockUserDao = {
    getUserByUuid: jest.fn().mockResolvedValue({ uuid: 'test-user-uuid' }),
  };

  const mockPermissionsDao = {
    getUserPermissions: jest.fn().mockResolvedValue([
      {
        name: 'ADD_NEW_TEXTS',
      },
    ]),
  };

  const mockTextDao = {
    insertTextRow: jest.fn().mockResolvedValue(),
    textExists: jest.fn().mockResolvedValue(false),
  };

  const mockHierarchyDao = {
    insertHierarchyRow: jest.fn().mockResolvedValue(),
  };

  const mockItemPropertiesDao = {
    insertItemPropertyRows: jest.fn().mockResolvedValue(),
  };

  const mockResourceDao = {
    insertResourceRow: jest.fn().mockResolvedValue(),
    insertLinkRow: jest.fn().mockResolvedValue(),
  };

  const mockTextDiscourseDao = {
    insertDiscourseRow: jest.fn().mockResolvedValue(),
  };

  const mockTextEpigraphyDao = {
    insertEpigraphyRow: jest.fn().mockResolvedValue(),
  };

  const mockTextMarkupDao = {
    insertMarkupRow: jest.fn().mockResolvedValue(),
  };

  const mockPublicDenylistDao = {
    addItemsToDenylist: jest.fn().mockResolvedValue(),
  };

  const mockTreeDao = {
    insertTreeRow: jest.fn().mockResolvedValue(),
  };

  const mockUtils = {
    createTransaction: jest.fn(async cb => {
      await cb();
    }),
  };

  const mockCache = {
    clear: jest.fn(),
  };

  const setup = () => {
    sl.set('UserDao', mockUserDao);
    sl.set('PermissionsDao', mockPermissionsDao);
    sl.set('TextDao', mockTextDao);
    sl.set('HierarchyDao', mockHierarchyDao);
    sl.set('ItemPropertiesDao', mockItemPropertiesDao);
    sl.set('ResourceDao', mockResourceDao);
    sl.set('TextDiscourseDao', mockTextDiscourseDao);
    sl.set('TextEpigraphyDao', mockTextEpigraphyDao);
    sl.set('TextMarkupDao', mockTextMarkupDao);
    sl.set('PublicDenylistDao', mockPublicDenylistDao);
    sl.set('TreeDao', mockTreeDao);
    sl.set('utils', mockUtils);
    sl.set('cache', mockCache);
  };

  beforeEach(setup);

  const sendRequest = (auth = true) => {
    const req = request(app).post(PATH).send(mockBody);
    if (auth) {
      return req.set('Authorization', 'token');
    }
    return req;
  };

  it('returns 201 on successful text creation', async () => {
    const response = await sendRequest();
    expect(mockTextDao.insertTextRow).toHaveBeenCalledWith(
      mockBody.tables.text,
      undefined
    );
    expect(mockHierarchyDao.insertHierarchyRow).toHaveBeenCalledWith(
      mockBody.tables.hierarchy,
      undefined
    );
    expect(mockItemPropertiesDao.insertItemPropertyRows).toHaveBeenCalledWith(
      mockBody.tables.itemProperties,
      undefined
    );
    expect(mockResourceDao.insertResourceRow).toHaveBeenCalledWith(
      mockBody.tables.resources[0],
      undefined
    );
    expect(mockResourceDao.insertLinkRow).toHaveBeenCalledWith(
      mockBody.tables.links[0],
      undefined
    );
    expect(mockTreeDao.insertTreeRow).toHaveBeenCalledWith(
      mockBody.tables.trees[0],
      undefined
    );
    expect(mockTextDiscourseDao.insertDiscourseRow).toHaveBeenCalledWith(
      mockBody.tables.discourses[0],
      undefined
    );
    expect(mockTextEpigraphyDao.insertEpigraphyRow).toHaveBeenCalledWith(
      mockBody.tables.epigraphies[0],
      undefined
    );
    expect(mockTextMarkupDao.insertMarkupRow).toHaveBeenCalledWith(
      mockBody.tables.markups[0],
      undefined
    );
    expect(mockPublicDenylistDao.addItemsToDenylist).toHaveBeenCalledWith(
      [mockBody.tables.text.uuid],
      'text',
      undefined
    );
    expect(response.status).toBe(201);
  });

  it('returns 401 if user is not logged in', async () => {
    const response = await sendRequest(false);
    expect(response.status).toBe(401);
  });

  it('returns 403 if user does not have permission to add texts', async () => {
    sl.set('PermissionsDao', {
      ...mockPermissionsDao,
      getUserPermissions: jest.fn().mockResolvedValue([]),
    });
    const response = await sendRequest();
    expect(response.status).toBe(403);
  });

  it('returns 500 if text creation fails', async () => {
    sl.set('TextDao', {
      ...mockTextDao,
      insertTextRow: jest.fn().mockRejectedValue('Failed to insert text row'),
    });
    const response = await sendRequest();
    expect(response.status).toBe(500);
  });
});
