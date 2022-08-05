import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import PropertyInfo from '../PropertyInfo.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('Property Info Test', () => {
  const mockStore = {
    getters: {
      isAdmin: true,
    },
    hasPermission: name =>
      ['ADD_EDIT_FIELD_DESCRIPTION', 'VIEW_FIELD_DESCRIPTION'].includes(name),
  };

  const mockServer = {
    updatePropertyDescriptionField: jest.fn().mockResolvedValue(),
    createNewPropertyDescriptionField: jest.fn().mockResolvedValue(),
    getFieldInfo: jest.fn().mockResolvedValue(),
  };

  const mockActions = {
    showSnackbar: jest.fn(),
    showErrorSnackbar: jest.fn(),
  };

  const noDescriptionProps = {
    variableOrValueUuid: 'refUuid',
    name: undefined,
    description: undefined,
    primacy: undefined,
    fieldUuid: undefined,
    language: undefined,
    type: undefined,
    tableReference: undefined,
  };

  const existsProps = {
    variableOrValueUuid: 'refUuid',
    name: 'name',
    description: 'description',
    primacy: 1,
    fieldUuid: 'fieldUuid',
    language: 'default',
    type: 'link',
    tableReference: 'tableReference',
  };

  const primacy2Props = {
    variableOrValueUuid: 'refUuid',
    name: 'name',
    description: 'description',
    primacy: 2,
    fieldUuid: 'fieldUuid',
    language: 'default',
    type: 'link',
    tableReference: 'tableReference',
  };

  const renderOptions = {
    localVue,
    vuetify,
    propsData: existsProps,
  };

  const createWrapper = (render = renderOptions, store = mockStore) => {
    sl.set('store', store);
    sl.set('serverProxy', mockServer);
    sl.set('globalActions', mockActions);

    return mount(PropertyInfo, render);
  };

  it('Submits on create as admin primacy 1', async () => {
    const wrapper = createWrapper({
      ...renderOptions,
      propsData: noDescriptionProps,
    });
    expect(wrapper.find('.info-popover-test').exists()).toBe(true);
    await wrapper.find('.info-icon-test').trigger('click');
    expect(wrapper.find('.card-test').exists()).toBe(true);
    await wrapper.find('.add-button-test').trigger('click');
    expect(wrapper.find('.new-description-test').exists()).toBe(true);
    const descriptionInput = wrapper.find('.new-description-test');
    descriptionInput.element.value = 'new description';
    descriptionInput.trigger('input');
    const primacyInput = wrapper.get('.v-select__selections');
    await primacyInput.trigger('click');
    const primacyOption = wrapper.findAll('.v-list-item__title').at(0);
    await primacyOption.trigger('click');
    await primacyInput.trigger('input');
    await wrapper.find('.add-submit-test').trigger('click');
    await flushPromises();
    expect(mockServer.createNewPropertyDescriptionField).toHaveBeenCalled();
    expect(mockServer.getFieldInfo).toHaveBeenCalled();
  });

  it('Submits on create as admin primacy 2', async () => {
    const wrapper = createWrapper({
      ...renderOptions,
      propsData: noDescriptionProps,
    });
    expect(wrapper.find('.info-popover-test').exists()).toBe(true);
    await wrapper.find('.info-icon-test').trigger('click');
    expect(wrapper.find('.card-test').exists()).toBe(true);
    await wrapper.find('.add-button-test').trigger('click');
    expect(wrapper.find('.new-description-test').exists()).toBe(true);
    const descriptionInput = wrapper.find('.new-description-test');
    descriptionInput.element.value = 'new description';
    descriptionInput.trigger('input');
    const primacyInput = wrapper.get('.v-select__selections');
    await primacyInput.trigger('click');
    const primacyOption = wrapper.findAll('.v-list-item__title').at(1);
    await primacyOption.trigger('click');
    await primacyInput.trigger('input');
    await wrapper.find('.add-submit-test').trigger('click');
    await flushPromises();
    expect(mockServer.createNewPropertyDescriptionField).toHaveBeenCalled();
    expect(mockServer.getFieldInfo).toHaveBeenCalled();
  });

  it('Submits on edit as admin primacy 1', async () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.info-popover-test').exists()).toBe(true);
    await wrapper.find('.info-icon-test').trigger('click');
    expect(wrapper.find('.card-test').exists()).toBe(true);
    await wrapper.find('.edit-button-test').trigger('click');
    expect(wrapper.find('.new-description-test').exists()).toBe(true);
    const descriptionInput = wrapper.get('.new-description-test');
    descriptionInput.element.value = 'new description';
    await descriptionInput.trigger('input');
    await wrapper.find('.edit-submit-test').trigger('click');
    await flushPromises();
    expect(mockServer.updatePropertyDescriptionField).toHaveBeenCalled();
    expect(mockServer.getFieldInfo).toHaveBeenCalled();
  });

  it('Submits on edit as admin primacy 2', async () => {
    const wrapper = createWrapper();
    expect(wrapper.find('.info-popover-test').exists()).toBe(true);
    await wrapper.find('.info-icon-test').trigger('click');
    expect(wrapper.find('.card-test').exists()).toBe(true);
    await wrapper.find('.edit-button-test').trigger('click');
    expect(wrapper.find('.new-description-test').exists()).toBe(true);
    const descriptionInput = wrapper.get('.new-description-test');
    descriptionInput.element.value = 'new description';
    await descriptionInput.trigger('input');
    const primacyInput = wrapper.get('.v-select__selections');
    await primacyInput.trigger('click');
    const primacyOption = wrapper.findAll('.v-list-item__title').at(1);
    await primacyOption.trigger('click');
    await primacyInput.trigger('input');
    await wrapper.find('.edit-submit-test').trigger('click');
    await flushPromises();
    expect(mockServer.updatePropertyDescriptionField).toHaveBeenCalled();
    expect(mockServer.getFieldInfo).toHaveBeenCalled();
  });

  it('Submits on create as permission-granted non-admin user primacy 1', async () => {
    const wrapper = createWrapper(
      {
        ...renderOptions,
        propsData: noDescriptionProps,
      },
      {
        getters: {
          isAdmin: false,
        },
        hasPermission: name =>
          ['VIEW_FIELD_DESCRIPTION', 'ADD_EDIT_FIELD_DESCRIPTION'].includes(
            name
          ),
      }
    );
    expect(wrapper.find('.info-popover-test').exists()).toBe(true);
    await wrapper.find('.info-icon-test').trigger('click');
    expect(wrapper.find('.card-test').exists()).toBe(true);
    await wrapper.find('.add-button-test').trigger('click');
    expect(wrapper.find('.new-description-test').exists()).toBe(true);
    const descriptionInput = wrapper.find('.new-description-test');
    descriptionInput.element.value = 'new description';
    descriptionInput.trigger('input');
    const primacyInput = wrapper.get('.v-select__selections');
    await primacyInput.trigger('click');
    const primacyOption = wrapper.findAll('.v-list-item__title').at(0);
    await primacyOption.trigger('click');
    await primacyInput.trigger('input');
    await wrapper.find('.add-submit-test').trigger('click');
    await flushPromises();
    expect(mockServer.createNewPropertyDescriptionField).toHaveBeenCalled();
    expect(mockServer.getFieldInfo).toHaveBeenCalled();
  });

  it('Submits on edit as permission-granted non-admin user primacy 1', async () => {
    const wrapper = createWrapper(renderOptions, {
      getters: {
        isAdmin: false,
      },
      hasPermission: name =>
        ['VIEW_FIELD_DESCRIPTION', 'ADD_EDIT_FIELD_DESCRIPTION'].includes(name),
    });
    expect(wrapper.find('.info-popover-test').exists()).toBe(true);
    await wrapper.find('.info-icon-test').trigger('click');
    expect(wrapper.find('.card-test').exists()).toBe(true);
    await wrapper.find('.edit-button-test').trigger('click');
    expect(wrapper.find('.new-description-test').exists()).toBe(true);
    const descriptionInput = wrapper.get('.new-description-test');
    descriptionInput.element.value = 'new description';
    await descriptionInput.trigger('input');
    await wrapper.find('.edit-submit-test').trigger('click');
    await flushPromises();
    expect(mockServer.updatePropertyDescriptionField).toHaveBeenCalled();
    expect(mockServer.getFieldInfo).toHaveBeenCalled();
  });

  it('hides primacy 2 descriptions when there is no permission', async () => {
    const wrapper = createWrapper(
      {
        ...renderOptions,
        propsData: primacy2Props,
      },
      {
        getters: {
          isAdmin: false,
        },
        hasPermission: name => [].includes(name),
      }
    );
    expect(wrapper.find('.info-popover-test').exists()).toBe(false);
  });

  it('hides primacy 2 descriptions when there is wrong permission', async () => {
    const wrapper = createWrapper(
      {
        ...renderOptions,
        propsData: primacy2Props,
      },
      {
        getters: {
          isAdmin: false,
        },
        hasPermission: name => ['ADD_EDIT_FIELD_DESCRIPTION'].includes(name),
      }
    );
    expect(wrapper.find('.info-popover-test').exists()).toBe(false);
  });

  it('shows primacy 2 descriptions when there is proper permission', async () => {
    const wrapper = createWrapper(
      {
        ...renderOptions,
        propsData: primacy2Props,
      },
      {
        getters: {
          isAdmin: false,
        },
        hasPermission: name => ['VIEW_FIELD_DESCRIPTION'].includes(name),
      }
    );
    expect(wrapper.find('.info-popover-test').exists()).toBe(true);
    await wrapper.find('.info-icon-test').trigger('click');
    expect(wrapper.find('.card-test').exists()).toBe(true);
  });

  it('shows edit button when there is proper permission', async () => {
    const wrapper = createWrapper(renderOptions, {
      getters: {
        isAdmin: false,
      },
      hasPermission: name => ['ADD_EDIT_FIELD_DESCRIPTION'].includes(name),
    });
    expect(wrapper.find('.info-popover-test').exists()).toBe(true);
    await wrapper.find('.info-icon-test').trigger('click');
    expect(wrapper.find('.card-test').exists()).toBe(true);
    expect(wrapper.find('.edit-button-test').exists()).toBe(true);
  });

  it('hides edit button when there is no permission', async () => {
    const wrapper = createWrapper(renderOptions, {
      getters: {
        isAdmin: false,
      },
      hasPermission: name => [].includes(name),
    });
    expect(wrapper.find('.info-popover-test').exists()).toBe(true);
    await wrapper.find('.info-icon-test').trigger('click');
    expect(wrapper.find('.card-test').exists()).toBe(true);
    expect(wrapper.find('.edit-button-test').exists()).toBe(false);
  });

  it('hides edit button when there is wrong permission', async () => {
    const wrapper = createWrapper(renderOptions, {
      getters: {
        isAdmin: false,
      },
      hasPermission: name => ['VIEW_FIELD_DESCRIPTION'].includes(name),
    });
    expect(wrapper.find('.info-popover-test').exists()).toBe(true);
    await wrapper.find('.info-icon-test').trigger('click');
    expect(wrapper.find('.card-test').exists()).toBe(true);
    expect(wrapper.find('.edit-button-test').exists()).toBe(false);
  });

  it('hides edit button when not admin and primacy 2', async () => {
    const wrapper = createWrapper(
      {
        ...renderOptions,
        propsData: primacy2Props,
      },
      {
        getters: {
          isAdmin: false,
        },
        hasPermission: name =>
          ['VIEW_FIELD_DESCRIPTION', 'ADD_EDIT_FIELD_DESCRIPTION'].includes(
            name
          ),
      }
    );
    expect(wrapper.find('.info-popover-test').exists()).toBe(true);
    await wrapper.find('.info-icon-test').trigger('click');
    expect(wrapper.find('.card-test').exists()).toBe(true);
    expect(wrapper.find('.edit-button-test').exists()).toBe(false);
  });
});
