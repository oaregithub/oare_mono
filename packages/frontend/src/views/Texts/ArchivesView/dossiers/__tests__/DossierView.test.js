import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import sl from '@/serviceLocator';
import DossierView from '../index.vue';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('DossierView', () => {
  const dossier = {
    id: '1',
    uuid: 'uuid',
    parentUuid: 'parentuuid',
    name: 'name',
    owner: 'owner',
    archLocus: 'archLocus',
    texts: [
      {
        uuid: 'textUuid',
        type: 'type',
        name: 'textName',
        excavationPrefix: 'e prefix',
        excavationNumber: '1',
        museumPrefix: 'm prefix',
        museumNumber: '1',
        publicationPrefix: 'p prefix',
        publicationNumber: '1',
      },
    ],
    totalTexts: 1,
  };

  const mockServer = {
    getDossier: jest.fn().mockResolvedValue(dossier),
    disconnectText: jest.fn().mockResolvedValue(),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
    showSnackbar: jest.fn(),
  };

  const mockStore = {
    hasPermission: () => true,
    getters: {
      isAdmin: true,
    },
  };

  const createWrapper = ({ server, actions, store } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', actions || mockActions);
    sl.set('store', store || mockStore);

    return mount(DossierView, {
      vuetify,
      localVue,
      stubs: ['router-link'],
      propsData: { dossierUuid: dossier.uuid },
    });
  };

  it('retrieves dossier on load', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getDossier).toHaveBeenCalled();
  });

  it('shows error snackbar when archives fail to load', async () => {
    createWrapper({
      server: {
        getDossier: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });

  it('disconnects text from dossier on request', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    const deleteButton = wrapper.find('.disconnect-btn');
    await deleteButton.trigger('click');
    await flushPromises();
    const submitBtn = wrapper.find('.test-submit-btn');
    await submitBtn.trigger('click');
    expect(mockServer.disconnectText).toHaveBeenCalled();
  });

  it('does not allow disconnect when not admin', async () => {
    const wrapper = createWrapper({
      store: {
        getters: {
          isAdmin: false,
        },
      },
    });
    await flushPromises();
    expect(wrapper.find('.disconnect-btn').exists()).toBe(false);
  });
});
