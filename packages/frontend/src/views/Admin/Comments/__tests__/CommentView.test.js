import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import { DateTime } from 'luxon';
import CommentView from '../components/CommentView.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

const date = new Date();
const comment1 = {
  text: 'comment1',
};
const comment2 = {
  text: 'comment2',
};
const comment3 = {
  text: 'comment3',
};
const comment4 = {
  text: 'comment4',
};

const mockThreadDisplays = [
  {
    thread: {
      uuid: 'uuid1',
      name: 'testName',
      status: 'testStatus',
      referenceUuid: 'testReferenceUuid',
      route: '/dictionaryWord/uuid',
    },
    word: 'testItem',
    latestCommentDate: date,
    comments: [comment1, comment2, comment3, comment4],
  },
];

const mockServerCount = 1;

const renderOptions = {
  localVue,
  vuetify,
  propsData: {
    isUserComments: false,
  },
  stubs: ['router-link'],
};

const mockActions = {
  showSnackbar: jest.fn(),
  showErrorSnackbar: jest.fn(),
};

const mockRequest = {
  filters: {
    status: 'All',
    thread: '',
    item: '',
    comment: '',
  },
  sort: {
    type: 'timestamp',
    desc: true,
  },
  pagination: {
    page: 1,
    limit: 10,
  },
  isUserComments: false,
};

const mockResponse = {
  threads: mockThreadDisplays,
  count: mockServerCount,
};

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

const mockThreadDisplaysResponse = [
  {
    ...testThread,
    comments: [testComment],
  },
];

const mockServer = {
  getAllThreads: jest.fn().mockResolvedValue(mockResponse),
  getThreadsWithCommentsByReferenceUuid: jest
    .fn()
    .mockResolvedValue(mockThreadDisplaysResponse),
  getDictionaryInfo: jest.fn().mockResolvedValue({
    word: 'testingWord',
    forms: [],
    partsOfSpeech: [],
    verbalThematicVowelTypes: [],
    specialClassifications: [],
    translations: [],
  }),
};

const adminUser = {
  uuid: 'uuid',
  isAdmin: true,
};

const mockStore = {
  getters: {
    user: adminUser,
    permissions: [],
  },
};

const mockLodash = {
  debounce: cb => cb,
};

const mockRouter = {
  currentRoute: {
    name: 'testName',
  },
};

const setup = () => {
  sl.set('serverProxy', mockServer);
  sl.set('globalActions', mockActions);
  sl.set('lodash', mockLodash);
  sl.set('store', mockStore);
  sl.set('router', mockRouter);
};

beforeEach(setup);

describe('CommentView test', () => {
  const createWrapper = () => mount(CommentView, renderOptions);

  it('successfully retrieves thread displays on load', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.html()).toContain('comment1');
    expect(wrapper.html()).toContain('comment2');
    expect(wrapper.html()).toContain('comment3');
    expect(wrapper.html()).not.toContain('comment4');
    expect(wrapper.html()).toContain('testItem');
    expect(wrapper.html()).toContain('testName');
    expect(wrapper.html()).toContain('testStatus');
    const timestamp = DateTime.fromJSDate(new Date(date)).toLocaleString(
      DateTime.DATETIME_MED
    );
    expect(wrapper.html()).toContain(timestamp);
  });

  it('display see more comments popup when more than three comments', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const viewAllCommentsExists = wrapper
      .find('.test-view-all-comments-dialog')
      .exists();
    expect(viewAllCommentsExists).toBe(false);

    await wrapper.get('.test-view-all-comments').trigger('click');

    const allComments = wrapper
      .get('.test-view-all-comments-dialog')
      .findAll('.test-comment');
    expect(allComments.length).toBe(4);

    const viewAllCommentsDialogTitle = wrapper
      .get('.test-view-all-comments-dialog')
      .get('.test-dialog-title');
    expect(viewAllCommentsDialogTitle.html()).toContain('All Comments');
  });

  it('successfully retrieves thread displays on load for admins', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getAllThreads).toHaveBeenLastCalledWith(mockRequest);
    expect(mockActions.showErrorSnackbar).not.toHaveBeenCalled();
  });

  it('display error when fails to load thread displays', async () => {
    sl.set('serverProxy', {
      getAllThreads: jest
        .fn()
        .mockRejectedValue('Unable to retrieve thread displays'),
    });

    createWrapper();
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('filters by status and clears', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const statusFilter = wrapper.get('.test-status-filter input');
    await statusFilter.trigger('click');
    const option = wrapper.findAll('.v-list-item__title').at(1);
    await option.trigger('click');
    await flushPromises();
    expect(mockServer.getAllThreads).toHaveBeenLastCalledWith({
      ...mockRequest,
      filters: {
        ...mockRequest.filters,
        status: 'In Progress',
      },
    });
    await wrapper.findAll('button.mdi-close').trigger('click');
    expect(mockServer.getAllThreads).toHaveBeenLastCalledWith(mockRequest);
  });

  it('filters by thread name and clears', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const threadNameFilter = wrapper.get('.test-name-filter input');
    await threadNameFilter.setValue('testName');
    await flushPromises();
    expect(mockServer.getAllThreads).toHaveBeenLastCalledWith({
      ...mockRequest,
      filters: {
        ...mockRequest.filters,
        thread: 'testName',
      },
    });
    await wrapper.findAll('button.mdi-close').trigger('click');
    expect(mockServer.getAllThreads).toHaveBeenLastCalledWith(mockRequest);
  });

  it('filters by item and clears', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const itemFilter = wrapper.get('.test-item-filter input');
    await itemFilter.setValue('testItem');
    await flushPromises();
    expect(mockServer.getAllThreads).toHaveBeenLastCalledWith({
      ...mockRequest,
      filters: {
        ...mockRequest.filters,
        item: 'testItem',
      },
    });
    await wrapper.findAll('button.mdi-close').trigger('click');
    expect(mockServer.getAllThreads).toHaveBeenLastCalledWith(mockRequest);
  });

  it('filters by comment and clears', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const commentFilter = wrapper.get('.test-comment-filter input');
    await commentFilter.setValue('testComment');
    await flushPromises();
    expect(mockServer.getAllThreads).toHaveBeenLastCalledWith({
      ...mockRequest,
      filters: {
        ...mockRequest.filters,
        comment: 'testComment',
      },
    });
    await wrapper.findAll('button.mdi-close').trigger('click');
    expect(mockServer.getAllThreads).toHaveBeenLastCalledWith(mockRequest);
  });

  it('sorts by status', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const statusSort = wrapper.findAll('.v-data-table-header__icon').at(0);
    await statusSort.trigger('click');
    expect(mockServer.getAllThreads).toHaveBeenLastCalledWith({
      ...mockRequest,
      sort: {
        type: 'status',
        desc: false,
      },
    });
  });

  it('sorts by thread name', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const statusSort = wrapper.findAll('.v-data-table-header__icon').at(1);
    await statusSort.trigger('click');
    expect(mockServer.getAllThreads).toHaveBeenLastCalledWith({
      ...mockRequest,
      sort: {
        type: 'name',
        desc: false,
      },
    });
  });

  it('sorts by item', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const statusSort = wrapper.findAll('.v-data-table-header__icon').at(2);
    await statusSort.trigger('click');
    expect(mockServer.getAllThreads).toHaveBeenLastCalledWith({
      ...mockRequest,
      sort: {
        type: 'item',
        desc: false,
      },
    });
  });

  it('sort by timestamp', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    const statusSort = wrapper.findAll('.v-data-table-header__icon').at(3);
    await statusSort.trigger('click');
    expect(mockServer.getAllThreads).toHaveBeenLastCalledWith({
      ...mockRequest,
      sort: {
        type: 'timestamp',
        desc: false,
      },
    });
  });

  it('display comment dialog when thread name selected', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    let dialog = wrapper.findAll('.test-comment-word-display').exists();
    expect(dialog).toBe(false);
    const threadNameButton = wrapper.findAll('.test-thread-name').at(0);
    await threadNameButton.trigger('click');

    dialog = wrapper.findAll('.test-comment-word-display').exists();
    expect(dialog).toBe(true);
  });

  it('display footer in comment dialog', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    const threadNameButton = wrapper.findAll('.test-thread-name').at(0);
    await threadNameButton.trigger('click');

    await flushPromises();
    expect(mockServer.getDictionaryInfo).toHaveBeenCalled();
  });
});
