import Vuetify from 'vuetify';
import VueCompositionApi from '@vue/composition-api';
import { mount, createLocalVue } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import PublicationsView from '../index.vue';
import sl from '../../../../serviceLocator';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueCompositionApi);

describe('PublicationsView', () => {
  const mockServer = {
    getAllPublications: jest.fn().mockResolvedValue([]),
  };

  const mockActions = {
    showErrorSnackbar: jest.fn(),
  };

  const createWrapper = ({ server, actions } = {}) => {
    sl.set('serverProxy', server || mockServer);
    sl.set('globalActions', actions || mockActions);

    return mount(PublicationsView, {
      vuetify,
      localVue,
      propsData: {
        letter: 'A',
      },
      stubs: ['router-link'],
    });
  };

  it('retrieves collections on load', async () => {
    createWrapper();
    await flushPromises();
    expect(mockServer.getAllPublications).toHaveBeenCalled();
  });

  it('shows error snackbar when collections fail to load', async () => {
    createWrapper({
      server: {
        getAllPublications: jest.fn().mockRejectedValue(null),
      },
    });
    await flushPromises();
    expect(mockActions.showErrorSnackbar).toHaveBeenCalled();
  });
});
