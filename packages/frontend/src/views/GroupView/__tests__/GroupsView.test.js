import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import GroupView from '../index.vue';
import sl from '../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('GroupsView', () => {
  const mockServer = {
    getGroupName: jest.fn().mockResolvedValue(),
  };
  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };
  const createWrapper = ({ server } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', mockActions);

    return mount(GroupView, {
      localVue,
      vuetify,
      propsData: {
        groupId: '1',
      },
      stubs: ['router-link', 'router-view'],
    });
  };

  it('displays group information', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getGroupName).toHaveBeenCalled();
  });

  it('displays error upon failed retrieval of group info', async () => {
    createWrapper({
      server: {
        getGroupName: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
