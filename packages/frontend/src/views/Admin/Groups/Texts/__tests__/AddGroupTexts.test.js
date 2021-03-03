import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import AddGroupTexts from '../AddGroupTexts.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('AddGroupTexts test', () => {
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
    addTextGroups: jest.fn().mockResolvedValue(null),
    getGroupName: jest.fn().mockResolvedValue('testGroup'),
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
    propsData: {
      groupId: '1',
    },
    stubs: ['router-link'],
  };

  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);
    sl.set('router', mockRouter);
    sl.set('lodash', mockLodash);

    return mount(AddGroupTexts, renderOptions);
  };

  it('successfully retrieves all texts on load', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockServer.searchNames).toHaveBeenCalled();
    expect(wrapper.html()).toContain('test1');
  });

  it('successfully retrieves group name', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(mockServer.getGroupName).toHaveBeenCalled();
    expect(wrapper.html()).toContain('testGroup');
  });

  it('displays error on failed group name retreival', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getGroupName: jest.fn().mockRejectedValue('failed name retrieval'),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('displays error on failed text load', async () => {
    createWrapper({
      server: {
        ...mockServer,
        searchNames: jest.fn().mockRejectedValue('failed text load'),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('successfully adds texts to blacklist', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.findAll('.v-data-table__checkbox').at(1).trigger('click');
    await wrapper.get('.test-add').trigger('click');
    await wrapper.get('.test-submit-btn').trigger('click');
    expect(mockServer.addTextGroups).toHaveBeenCalled();
    await flushPromises();
    expect(mockActions.showSnackbar).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalled();
  });

  it('displays error on failed add', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        addTextGroups: jest.fn().mockRejectedValue('failed text add'),
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
