import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import OarePageContent from '@/components/base/OarePageContent.vue';
import sl from '@/serviceLocator';
import flushPromises from 'flush-promises';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('PageContent', () => {
  const mockServer = {
    getPageContent: jest.fn().mockResolvedValue({ content: 'mock-content' }),
    updatePageContent: jest.fn().mockResolvedValue(),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const mockStore = {
    getters: {
      isAdmin: true,
    },
  };

  const renderOptions = {
    propsData: { pageName: 'testPageName' },
    localVue,
    vuetify,
  };

  const setup = () => {
    sl.set('serverProxy', mockServer);
    sl.set('globalActions', mockActions);
    sl.set('store', mockStore);
  };

  beforeEach(setup);

  const createWrapper = () => {
    return mount(OarePageContent, renderOptions);
  };

  it('retrieves page content', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getPageContent).toHaveBeenCalled();
  });

  it('displays error message when retrieving fails', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      getPageContent: jest
        .fn()
        .mockRejectedValue('failed to retrieve search count'),
    });
    createWrapper();
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('edit button shows up to admins only', async () => {
    sl.set('store', {
      ...mockStore,
      getters: {
        isAdmin: false,
      },
    });
    const wrapper = createWrapper();
    await flushPromises();
    const editButton = wrapper.find('.test-edit-button').exists();
    expect(editButton).toBe(false);
  });

  it('edit button shows up for admins', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const editButton = wrapper.find('.test-edit-button').exists();
    expect(editButton).toBe(true);
  });

  it('edits page content', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-edit-button').trigger('click');
    await wrapper.get('.test-save-button').trigger('click');
    await flushPromises();
    expect(mockServer.updatePageContent).toHaveBeenCalled();
  });

  it('displays error message when editing fails', async () => {
    sl.set('serverProxy', {
      ...mockServer,
      updatePageContent: jest
        .fn()
        .mockRejectedValue('failed to retrieve search count'),
    });
    const wrapper = createWrapper();
    await flushPromises();
    await wrapper.get('.test-edit-button').trigger('click');
    await wrapper.get('.test-save-button').trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
