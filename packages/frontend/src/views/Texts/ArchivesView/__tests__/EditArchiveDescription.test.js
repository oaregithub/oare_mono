import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import EditArchiveDescription from '../archives/EditArchiveDescription.vue';
import sl from '../../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('ArchiveInfo', () => {
  const mockServer = {
    updatePropertyDescriptionField: jest.fn().mockResolvedValue(),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const mockStore = {
    getters: {
      isAdmin: true,
    },
  };

  const mockProps = { uuid: 'uuid', description: 'description', primacy: 1 };

  const createWrapper = ({ server, actions, store, propsData } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', actions || mockActions);
    sl.set('store', store || mockStore);

    return mount(EditArchiveDescription, {
      vuetify,
      localVue,
      propsData: propsData ? { ...propsData } : { ...mockProps },
    });
  };

  it('edits description upon request by admin', async () => {
    const wrapper = createWrapper();
    const textInput = wrapper.findAll('.test-text-input input').at(0);
    await textInput.setValue('new description');
    await flushPromises();
    const checkButton = wrapper.find('.test-check');
    await checkButton.trigger('click');
    expect(mockServer.updatePropertyDescriptionField).toHaveBeenCalled();
  });

  it('cancels adds description upon request by admin', async () => {
    const wrapper = createWrapper();
    const textInput = wrapper.find('.test-text-input input');
    await textInput.setValue('new description');
    await flushPromises();
    const closeButton = wrapper.findAll('.test-close');
    await closeButton.trigger('click');
    expect(mockServer.updatePropertyDescriptionField).toBeCalledTimes(0);
  });
});
