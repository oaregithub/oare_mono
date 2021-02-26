import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import ErrorLog from '../ErrorLog.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('ErrorLog test', () => {
  const mockServer = {
    getErrorLog: jest.fn().mockResolvedValue({
      errors: [
        {
          uuid: 'testUuid',
          user_uuid: 'testUser',
          description: 'testDescription',
          stacktrace: 'testStacktrace',
          timestamp: new Date(),
          status: 'testStatus',
          userName: 'testName',
        },
      ],
      count: 1,
    }),
  };

  const mockGetPayload = {
    filters: {
      status: '',
      user: '',
      description: '',
      stacktrace: '',
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

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const mockLodash = {
    debounce: cb => cb,
  };

  const renderOptions = {
    localVue,
    vuetify,
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);
    sl.set('lodash', mockLodash);

    return mount(ErrorLog, renderOptions);
  };

  it('successfully retrieves errors on load', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockServer.getErrorLog).toHaveBeenCalledWith(mockGetPayload);
    expect(wrapper.html()).toContain('testStatus');
    expect(wrapper.html()).toContain('testDescription');
    expect(wrapper.html()).toContain('testName');
  });

  it('displays error on failed errors load', async () => {
    createWrapper({
      server: {
        getErrorLog: jest.fn().mockRejectedValue('failed error load'),
      },
    });
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
    expect(mockServer.getErrorLog).toHaveBeenLastCalledWith({
      ...mockGetPayload,
      filters: {
        ...mockGetPayload.filters,
        status: 'In Progress',
      },
    });
    await wrapper.findAll('button.mdi-close').trigger('click');
    expect(mockServer.getErrorLog).toHaveBeenLastCalledWith(mockGetPayload);
  });

  it('filters by user and clears', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const userFilter = wrapper.get('.test-user-filter input');
    await userFilter.setValue('test');
    await flushPromises();
    expect(mockServer.getErrorLog).toHaveBeenLastCalledWith({
      ...mockGetPayload,
      filters: {
        ...mockGetPayload.filters,
        user: 'test',
      },
    });
    await wrapper.findAll('button.mdi-close').trigger('click');
    expect(mockServer.getErrorLog).toHaveBeenLastCalledWith(mockGetPayload);
  });

  it('filters by description and clears', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const descriptionFilter = wrapper.get('.test-desc-filter input');
    await descriptionFilter.setValue('test');
    await flushPromises();
    expect(mockServer.getErrorLog).toHaveBeenLastCalledWith({
      ...mockGetPayload,
      filters: {
        ...mockGetPayload.filters,
        description: 'test',
      },
    });
    await wrapper.findAll('button.mdi-close').trigger('click');
    expect(mockServer.getErrorLog).toHaveBeenLastCalledWith(mockGetPayload);
  });

  it('filters by stacktrace and clears', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const stacktraceFilter = wrapper.get('.test-stack-filter input');
    await stacktraceFilter.setValue('test');
    await flushPromises();
    expect(mockServer.getErrorLog).toHaveBeenLastCalledWith({
      ...mockGetPayload,
      filters: {
        ...mockGetPayload.filters,
        stacktrace: 'test',
      },
    });
    await wrapper.findAll('button.mdi-close').trigger('click');
    expect(mockServer.getErrorLog).toHaveBeenLastCalledWith(mockGetPayload);
  });

  it('sorts by status', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const statusSort = wrapper.findAll('.v-data-table-header__icon').at(0);
    await statusSort.trigger('click');
    expect(mockServer.getErrorLog).toHaveBeenLastCalledWith({
      ...mockGetPayload,
      sort: {
        type: 'status',
        desc: false,
      },
    });
  });

  it('sorts by timestamp', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const statusSort = wrapper.findAll('.v-data-table-header__icon').at(1);
    await statusSort.trigger('click');
    expect(mockServer.getErrorLog).toHaveBeenLastCalledWith({
      ...mockGetPayload,
      sort: {
        type: 'timestamp',
        desc: false,
      },
    });
  });

  it('sorts by user name', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const statusSort = wrapper.findAll('.v-data-table-header__icon').at(2);
    await statusSort.trigger('click');
    expect(mockServer.getErrorLog).toHaveBeenLastCalledWith({
      ...mockGetPayload,
      sort: {
        type: 'userName',
        desc: false,
      },
    });
  });

  it('sorts by description', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const statusSort = wrapper.findAll('.v-data-table-header__icon').at(3);
    await statusSort.trigger('click');
    expect(mockServer.getErrorLog).toHaveBeenLastCalledWith({
      ...mockGetPayload,
      sort: {
        type: 'description',
        desc: false,
      },
    });
  });

  it('changes sort direction', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockServer.getErrorLog).toHaveBeenLastCalledWith({
      ...mockGetPayload,
      sort: {
        type: 'description',
        desc: true,
      },
    });
    const timestampArrow = wrapper.findAll('.v-data-table-header__icon').at(3);
    await timestampArrow.trigger('click');
    expect(mockServer.getErrorLog).toHaveBeenLastCalledWith({
      ...mockGetPayload,
      sort: {
        type: 'description',
        desc: false,
      },
    });
  });
});
