import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import AddGroupCollections from '../AddGroupCollections.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('AddGroupCollections test', () => {
  const mockServer = {
    searchNames: jest.fn().mockResolvedValue({
      items: [
        {
          uuid: 'test1',
          name: 'test1',
        },
        {
          uuid: 'test2',
          name: 'test2',
        },
      ],
      count: 2,
    }),
    addGroupCollections: jest.fn().mockResolvedValue(null),
  };

  const mockActions = {
    showSnackbar: jest.fn(),
    showErrorSnackbar: jest.fn(),
  };

  const mockLodash = {
    debounce: cb => cb,
  };

  const mockRouter = {
    replace: jest.fn(),
    push: jest.fn(),
  };

  const renderOptions = {
    localVue,
    vuetify,
    stubs: ['router-link'],
    propsData: {
      groupId: '1',
    },
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);
    sl.set('router', mockRouter);
    sl.set('lodash', mockLodash);

    return mount(AddGroupCollections, renderOptions);
  };

  it('successfully retrieves all collections on load', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockServer.searchNames).toHaveBeenCalled();
    expect(wrapper.html()).toContain('test1');
  });

  it('displays error on failed collections load', async () => {
    createWrapper({
      server: {
        ...mockServer,
        searchNames: jest.fn().mockRejectedValue('failed collections load'),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('successfully adds collections to group', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.findAll('.v-data-table__checkbox').at(1).trigger('click');
    await wrapper.get('.test-add').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.addGroupCollections).toHaveBeenCalled();
    await flushPromises();
    expect(mockActions.showSnackbar).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalled();
  });

  it('displays error on failed add', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        addGroupCollections: jest
          .fn()
          .mockRejectedValue('failed collection add'),
      },
    });
    await flushPromises();
    await wrapper.findAll('.v-data-table__checkbox').at(1).trigger('click');
    await wrapper.get('.test-add').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
