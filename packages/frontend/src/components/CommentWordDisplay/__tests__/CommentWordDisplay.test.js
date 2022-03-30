import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import CommentWordDisplay from '../index.vue';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

const testThread = {
  uuid: 'uuid1',
  name: 'threadName1',
  referenceUuid: 'itemUuid',
  status: 'New',
  route: '/dictionaryWord/uuid',
};

const testComment = {
  uuid: 'commentUuid',
  threadUuid: 'threadUuid',
  userUuid: 'userUuid',
  createdAt: new Date(),
  deleted: false,
  text: 'this is the comment text',
  userFirstName: 'firstName',
  userLastName: 'lastName',
};

const mockThreadDisplays = [
  {
    ...testThread,
    comments: [testComment],
  },
];

const threadUuidTest = 'threadUuidTest';
const commentUuidTest = 'commentUuidTest';

const commentResponse = {
  threadUuid: threadUuidTest,
  commentUuid: commentUuidTest,
};

const mockServer = {
  getThreadsWithCommentsByReferenceUuid: jest
    .fn()
    .mockResolvedValue(mockThreadDisplays),
  updateThread: jest.fn().mockResolvedValue({}),
  deleteComment: jest.fn().mockResolvedValue({}),
  insertComment: jest.fn().mockResolvedValue(commentResponse),
  updateThreadName: jest.fn().mockResolvedValue({}),
  getDictionaryInfo: jest.fn().mockResolvedValue({
    word: 'testingWord',
    forms: [],
    properties: [],
    translations: [],
  }),
};

const mockActions = {
  showSnackbar: jest.fn(),
  showErrorSnackbar: jest.fn(),
};

const adminUser = {
  uuid: 'uuid',
  isAdmin: true,
};

const nonAdminUser = {
  uuid: 'uuid',
  isAdmin: false,
};

const mockStore = {
  getters: {
    user: adminUser,
    permissions: [],
  },
};

const setup = () => {
  sl.set('serverProxy', mockServer);
  sl.set('globalActions', mockActions);
  sl.set('store', mockStore);
};

beforeEach(setup);

const propsWord = 'testWord';
const propsRoute = '/dictionaryWord/uuid';
const propsUuid = 'testUuid';
describe('CommentWordDisplay test', () => {
  const createWrapper = () =>
    mount(CommentWordDisplay, {
      vuetify,
      localVue,
      propsData: {
        word: propsWord,
        route: propsRoute,
        uuid: propsUuid,
        initialThreadUuid: testThread.uuid,
      },
      stubs: ['router-link'],
    });

  it('loads threads with comments on mount', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getThreadsWithCommentsByReferenceUuid).toHaveBeenCalled();
    expect(mockActions.showErrorSnackbar).not.toHaveBeenCalled();
  });

  it('shows error snackbar when fails to load threads with comments on mount', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      getThreadsWithCommentsByReferenceUuid: jest
        .fn()
        .mockRejectedValue(
          'Error, The threads with comments were not able to be retreived.'
        ),
    });

    createWrapper();
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('inserts comment', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-comment textarea').setValue('New Comment');
    await wrapper.get('.test-insert-comment').trigger('click');
    await flushPromises();

    expect(mockServer.insertComment).toHaveBeenCalled();
    expect(mockActions.showSnackbar).toHaveBeenCalled();
  });

  it('shows error snackbar when fails to insert a comment', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      insertComment: jest
        .fn()
        .mockRejectedValue('Error, unable to insert comment.'),
    });

    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-comment textarea').setValue('New Comment');
    await wrapper.get('.test-insert-comment').trigger('click');
    await flushPromises();

    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
