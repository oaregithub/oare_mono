import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import EditDescription from '@/components/Description/components/EditDescription.vue';
import AddDescription from '@/components/Description/components/AddDescription.vue';
import Description from '@/components/Description/index.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('EditDescription', () => {
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

    return mount(EditDescription, {
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

describe('AddDescription', () => {
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

    return mount(AddDescription, {
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

describe('DeleteDescription', () => {
  const fieldInfo = [
    {
      uuid: 'uuid',
      referenceUuid: 'referenceUuid',
      field: 'field',
      primacy: 1,
      language: 'default',
      type: 'description',
    },
  ];

  const mockServer = {
    deletePropertyDescriptionField: jest.fn().mockResolvedValue(),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const mockStore = {
    hasPermission: () => true,
  };

  const mockProps = {
    descriptions: fieldInfo,
    referenceUuid: 'refUuid',
    allowCUD: false,
  };

  const createWrapper = ({ server, actions, store, propsData } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', actions || mockActions);
    sl.set('store', store || mockStore);

    return mount(Description, {
      vuetify,
      localVue,
      stubs: ['router-link'],
      propsData: propsData ? { ...propsData } : { ...mockProps },
    });
  };

  it('deletes description upon request by admin', async () => {
    const wrapper = createWrapper({
      propsData: { ...mockProps, allowCUD: true },
    });
    await flushPromises();
    const deleteButton = wrapper.findAll('.test-delete-description').at(0);
    await deleteButton.trigger('click');
    const submitBtn = wrapper.find('.test-submit-btn');
    await submitBtn.trigger('click');
    expect(mockServer.deletePropertyDescriptionField).toHaveBeenCalled();
  });
});
