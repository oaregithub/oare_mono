import Vuetify from 'vuetify';
import VueCompositionApi, { PropType } from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import { DateTime } from 'luxon';
import AdminCommentView from '../AdminCommentView.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

const renderOptions = {
  localVue,
  vuetify,
};

const mockActions = {
  showSnackbar: jest.fn(),
  showErrorSnackbar: jest.fn(),
};

const mockRequest = {
  filters: {
    status: [],
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
};

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
    thread: { name: 'testName', status: 'testStatus' },
    word: 'testItem',
    latestCommentDate: date,
    comments: [comment1, comment2, comment3, comment4],
  },
];

const mockServerCount = 1;

const mockResponse = {
  threads: mockThreadDisplays,
  count: mockServerCount,
};

const mockServer = {
  getAllThreads: jest.fn().mockResolvedValue(mockResponse),
};

const mockLodash = {
  debounce: cb => cb,
};

const setup = () => {
  sl.set('serverProxy', mockServer);
  sl.set('globalActions', mockActions);
  sl.set('lodash', mockLodash);
};

beforeEach(setup);

describe('AdminCommentView test', () => {
  const createWrapper = () => mount(AdminCommentView, renderOptions);

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
        status: ['In Progress'],
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
});
