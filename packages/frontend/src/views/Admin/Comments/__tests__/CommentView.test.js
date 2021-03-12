import Vuetify from 'vuetify';
import VueCompositionApi, { PropType } from '@vue/composition-api';
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
    thread: { name: 'testName', status: 'testStatus' },
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
    threadDisplays: mockThreadDisplays,
    serverCount: mockServerCount,
    searchLoading: false,
    initialLoading: false,
  },
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

describe('CommentView test', () => {
  const createWrapper = () => mount(CommentView, renderOptions);

  it('successfully retrieves thread displays on load', async () => {
    const wrapper = createWrapper();
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
});
