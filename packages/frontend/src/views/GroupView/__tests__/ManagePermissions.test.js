import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import ManagePermissions from '../ManagePermissions.vue';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('ManagePermissions View test', () => {
  const mockAllPermissions = [
    {
      name: 'WORDS',
      type: 'pages',
      description:
        'Allow group users to view "Words" tab and access associated pages',
    },
    {
      name: 'NAMES',
      type: 'pages',
      description:
        'Allow group users to view "Names" tab and access associated pages',
    },
    {
      name: 'PLACES',
      type: 'pages',
      description:
        'Allow group users to view "Places" tab and access associated pages',
    },
    {
      name: 'UPDATE_FORM',
      type: 'dictionary',
      description: 'Allow group users to make changes to form(s) of words',
      dependency: 'WORDS',
    },
    {
      name: 'UPDATE_TRANSLATION',
      type: 'dictionary',
      description:
        'Allow group users to make changes to translations of existing words',
      dependency: 'WORDS',
    },
    {
      name: 'UPDATE_WORD_SPELLING',
      type: 'dictionary',
      description: 'Allow group users to change the spelling of existing words',
      dependency: 'WORDS',
    },
    {
      name: 'ADD_SPELLING',
      type: 'dictionary',
      description: 'Allow group users to add new spellings to existing words',
      dependency: 'WORDS',
    },
  ];

  const mockGroupPermissions = [
    {
      name: 'NAMES',
      type: 'pages',
      description:
        'Allow group users to view "Names" tab and access associated pages',
    },
    {
      name: 'UPDATE_FORM',
      type: 'dictionary',
      description: 'Allow group users to make changes to form(s) of words',
      dependency: 'WORDS',
    },
  ];

  const formatName = name => {
    const lowerCase = name.replace(/_/g, ' ').toLowerCase();
    return lowerCase.charAt(0).toUpperCase() + lowerCase.slice(1);
  };

  const mockServer = {
    addGroupPermission: jest.fn().mockResolvedValue(),
    removePermission: jest.fn().mockResolvedValue(),
    getGroupPermissions: jest.fn().mockResolvedValue(mockGroupPermissions),
    getAllPermissions: jest.fn().mockResolvedValue(mockAllPermissions),
  };
  const mockActions = {
    showErrorSnackbar: jest.fn(),
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

    return mount(ManagePermissions, renderOptions);
  };

  it('displays all permissions', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    mockAllPermissions.forEach(permission => {
      expect(wrapper.html()).toContain(formatName(permission.name));
      expect(wrapper.html()).toContain(permission.description);
    });
  });

  it('displays error when loading all permissions fails', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getAllPermissions: jest
          .fn()
          .mockRejectedValue('failed permissions load'),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('retrieves group permissions', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getGroupPermissions).toHaveBeenCalled();
  });

  it('displays error when loading group permissions fails', async () => {
    createWrapper({
      server: {
        ...mockServer,
        getGroupPermissions: jest
          .fn()
          .mockRejectedValue('failed group permission load'),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('adds permission', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const permissionToggle = wrapper.findAll('.test-switch input').at(0);
    await permissionToggle.trigger('click');
    await flushPromises();
    expect(mockServer.addGroupPermission).toHaveBeenCalled();
  });

  it('displays error on failed permission add', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        addGroupPermission: jest
          .fn()
          .mockRejectedValue('failed permission add'),
      },
    });
    await flushPromises();
    const permissionToggle = wrapper.findAll('.test-switch input').at(0);
    await permissionToggle.trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('removes permission', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const permissionToggle = wrapper.findAll('.test-switch input').at(1);
    await permissionToggle.trigger('click');
    await flushPromises();
    expect(mockServer.removePermission).toHaveBeenCalled();
  });

  it('displays error on failed permission removal', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        removePermission: jest
          .fn()
          .mockRejectedValue('failed permission removal'),
      },
    });
    await flushPromises();
    const permissionToggle = wrapper.findAll('.test-switch input').at(1);
    await permissionToggle.trigger('click');
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('disables switch for permissions that have unadded dependency', async () => {
    const wrapper = createWrapper({
      server: {
        ...mockServer,
        getAllPermissions: jest.fn().mockResolvedValue([
          {
            name: 'Main Permission',
            type: 'main',
            description: 'When off, dependent permissions should be disabled',
          },
          {
            name: 'Dependent Permission',
            type: 'dependent',
            description: 'disabled',
            dependency: 'Main Permission',
          },
        ]),
        getGroupPermissions: jest.fn().mockResolvedValue([]),
      },
    });
    await flushPromises();
    const disabledToggle = wrapper.findAll('.test-switch input').at(1);
    await flushPromises();
    expect(disabledToggle.element).toBeDisabled();
  });
});
