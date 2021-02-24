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
    thread: testThread,
    comments: [testComment],
  },
];

const threadUuidTest = 'threadUuidTest';
const commentUuidTest = 'commentUuidTest';

const commentResponse = {
  threadUuid: threadUuidTest,
  commentUuid: commentUuidTest,
};

const updateThreadNameRequest = {
  threadUuid: threadUuidTest,
  newName: 'newThreadName',
};

const wordToGetThreadsBy = 'testWord';

const mockServer = {
  getThreadsWithCommentsByReferenceUuid: jest
    .fn()
    .mockResolvedValue(mockThreadDisplays),
  updateThread: jest.fn().mockResolvedValue({}),
  deleteComment: jest.fn().mockResolvedValue({}),
  insertComment: jest.fn().mockResolvedValue(commentResponse),
  updateThreadName: jest.fn().mockResolvedValue(updateThreadNameRequest),
};

const mockActions = {
  showSnackbar: jest.fn(),
  showErrorSnackbar: jest.fn(),
};

const adminUser = {
  id: 1,
  uuid: 'uuid',
  firstName: 'John',
  lastName: 'Doe',
  email: 'fake@fake.com',
  isAdmin: true,
};

const nonAdminUser = {
  id: 1,
  uuid: 'uuid',
  firstName: 'John',
  lastName: 'Doe',
  email: 'fake@fake.com',
  isAdmin: false,
};

const mockStore = {
  getters: {
    user: adminUser,
  },
};

const setup = () => {
  sl.set('serverProxy', mockServer);
  sl.set('globalActions', mockActions);
  sl.set('store', mockStore);
};

beforeEach(setup);

describe('CommentWordDisplay test', () => {
  const createWrapper = () =>
    mount(CommentWordDisplay, {
      vuetify,
      localVue,
      propsData: {
        word: wordToGetThreadsBy,
        route: '/dictionaryWord/uuid',
        uuid: 'testUuid',
      },
      stubs: ['router-link'],
    });

  it('loads threads with comments on mount', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getThreadsWithCommentsByReferenceUuid).toHaveBeenCalled();
    expect(mockActions.showErrorSnackbar).not.toHaveBeenCalled();
  });

  it('fails to load threads with comments on mount', async () => {
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

  it('edit thread status if admin user', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-status-dropdown').trigger('click');
    await wrapper.get('.test-status-dropdown-item').trigger('click');
    await flushPromises();
    expect(mockServer.updateThread).toHaveBeenCalledWith({
      thread: testThread,
    });
    expect(mockActions.showSnackbar).toHaveBeenCalled();
    await flushPromises();
    expect(mockServer.getThreadsWithCommentsByReferenceUuid).toHaveBeenCalled();
  });
});
