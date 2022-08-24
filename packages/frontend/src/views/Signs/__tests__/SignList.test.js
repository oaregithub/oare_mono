import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import SignListView from '../index.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

const signList = [
  {
    signUuid: 'signUuid',
    name: 'name',
    abz: '123a',
    mzl: 123,
    hasPng: 0,
    frequency: 100,
    code: '100',
    readings: 'readings (1.00)',
  },
  {
    signUuid: 'signUuid2',
    name: 'name2',
    abz: '123b',
    mzl: 124,
    hasPng: 0,
    frequency: 100,
    code: '101',
    readings: 'readings (1.00)',
  },
];

describe('SignList test', () => {
  const mockServer = {
    getSignList: jest.fn().mockResolvedValue({ result: signList }),
  };
  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };
  const mockStore = {
    getters: { isAdmin: false },
  };
  const createWrapper = ({ server, actions } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', actions || mockActions);
    sl.set('store', mockStore);

    return mount(SignListView, {
      vuetify,
      localVue,
    });
  };

  it('gets signs', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getSignList).toHaveBeenCalled();
  });

  it('displays error when fails to retrieve signs', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getSignList: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('gets signs when sortBy is changed', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const sortByOptions = wrapper.find('.test-checkbox-abz');
    await sortByOptions.trigger('click');
    await flushPromises();
    expect(mockServer.getSignList).toHaveBeenCalled();
  });

  it('displays error when fails to retrieve sign list on sortByChange', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        getSignList: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    const sortByOptions = wrapper.find('.test-checkbox-abz');
    await sortByOptions.trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
