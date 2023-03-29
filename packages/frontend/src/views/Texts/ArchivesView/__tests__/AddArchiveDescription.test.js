import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import AddArchiveDescription from '../archives/AddArchiveDescription.vue';
import sl from '../../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('ArchiveInfo', () => {
  const mockServer = {
    createNewPropertyDescriptionField: jest.fn().mockResolvedValue(),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const mockStore = {
    getters: {
      isAdmin: true,
    },
  };

  const mockProps = {
    referenceUuid: 'refUuid',
    nextPrimacy: 2,
  };

  const createWrapper = ({ server, actions, store, propsData } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', actions || mockActions);
    sl.set('store', store || mockStore);

    return mount(AddArchiveDescription, {
      vuetify,
      localVue,
      propsData: propsData ? { ...propsData } : { ...mockProps },
    });
  };

  it('adds description upon request by admin', async () => {
    const wrapper = createWrapper();
    const textInput = wrapper.findAll('.test-text-input input').at(0);
    await textInput.setValue('new description');
    await flushPromises();
    const checkButton = wrapper.find('.test-check');
    await checkButton.trigger('click');
    expect(mockServer.createNewPropertyDescriptionField).toHaveBeenCalled();
  });

  it('cancels adds description upon request by admin', async () => {
    const wrapper = createWrapper();
    const textInput = wrapper.find('.test-text-input input');
    await textInput.setValue('new description');
    await flushPromises();
    const closeButton = wrapper.findAll('.test-close');
    await closeButton.trigger('click');
    expect(mockServer.createNewPropertyDescriptionField).toBeCalledTimes(0);
  });
});
